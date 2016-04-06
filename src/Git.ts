// This file is part of ts-git, copyright (c) 2016 BusFaster Ltd.
// Released under the MIT license, see LICENSE.

import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import * as stream from 'stream';
import * as Promise from 'bluebird';

/** Filtering options for retrieving logs. */

export interface GetLogOptions {
	/** Only match commits where file at path was changed. */
	path?: string;
	/** Only match up to given number of commits. */
	count?: number;
}

export interface FileInfo {
	mode: number;
	hash: string;
}

export interface UserTimeInfo {
	name: string;
	email: string;
	date: { seconds: number, offset: number };
}

export interface CommitInfo {
	tree: string;
	parents: string[];
	author: UserTimeInfo;
	committer: UserTimeInfo;
	message: string;
	hash: string;
}

export interface HeadInfo {
	branch?: string;
	hash?: string;
}

/** Get promise resolving to desired type of hash (eg. sha1) for contents of stream.
  * Optionally prefix contents with an arbitrary header before hashing. */

export function getHash(type: string, dataStream: stream.Readable, prefix?: string) {
	return(new Promise((resolve: (hash: string) => void, reject: (err: any) => void) => {
		var hash = crypto.createHash(type);

		if(prefix) hash.update(prefix);

		dataStream.on('data', function(chunk: Buffer) { hash.update(chunk); });
		dataStream.on('end', function() { resolve(hash.digest('hex')); });
		dataStream.on('error', function(err: any) { reject(err); });
	}))
}

export class Git {
	constructor(basePath: string) {
		this.basePath = basePath;
		this.repoPath = path.resolve(basePath, '.git');

		require('git-node-fs/mixins/fs-db')(this.repo, this.repoPath);
		require('js-git/mixins/walkers')(this.repo);

		Promise.promisifyAll(this.repo);
	}

	/** Get promise resolving to the hash of current working tree HEAD commit. */

	getWorkingHead() {
		var headPath = path.resolve(this.repoPath, 'HEAD');

		return(
			Promise.promisify(fs.readFile)(headPath).then((data: Buffer) => {
				var info: HeadInfo = {};
				var head = data.toString('utf8').trim();
				var match = data.toString('utf8').match(/^[0-9A-Fa-f]+$/);

				if(match) {
					info.hash = match[0];
					return(info);
				}

				match = head.match(/^ref:\s*([/A-Za-z]*)$/);
				if(match) {
					var refName = match[1];
					var readRef = this.repo.readRefAsync as (ref: string) => Promise<string>;

					match = refName.match(/^refs\/heads\/([A-Za-z]+([-.\/][A-Za-z]+)*)$/);

					if(match) info.branch = match[1];

					return(readRef(refName).then((hash: string) => {
						info.hash = hash;
						return(info);
					}));
				}

				throw(new Error('Error parsing HEAD ' + head));
			})
		);
	}

	/** Get info for commit based on its hash. */

	getCommit(commitHash: string) {
		var loadAsync = this.repo.loadAsAsync as (type: string, hash: string) => Promise<CommitInfo>;

		return(loadAsync('commit', commitHash));
	}

	/** Get absolute path to file inside working copy. */

	resolve(pathName: string) {
		return(path.resolve(this.basePath, pathName));
	}

	/** Get path to file inside working copy relative to its root. */

	relative(pathName: string) {
		return(path.relative(this.basePath, this.resolve(pathName)));
	}

	/** Get info for file at pathName inside tree. Tree is a hash
	  * pointing to the contents of a commit, defined in the commit's info. */

	findPath(treeHash: string, pathName: string) {
		var pathPartList = this.relative(pathName).split('/').reverse();

		var helper = (treeHash: string): Promise<FileInfo> => {
			var part = pathPartList.pop();
			var loadAsync = this.repo.loadAsAsync as (type: string, hash: string) => Promise<{ [name: string]: FileInfo }>;

			return(loadAsync('tree', treeHash).then((nameTbl: { [name: string]: FileInfo }) => {
				var item = nameTbl[part];

				if(!item) return(null);
				else if(pathPartList.length == 0) return(item);
				else return(helper(item.hash));
			}).catch((err: any): FileInfo => null));
		};

		return(helper(treeHash));
	}

	/** Get promise resolving to true if file inside working tree is dirty,
	  * false otherwise. */

	isDirty(pathName: string) {
		var statInfo: fs.Stats;
		var fileInfo: FileInfo;

		pathName = this.resolve(pathName);

		return(
			// Get file stats (size and modification time).
			Promise.promisify(fs.stat)(pathName).then((stats: fs.Stats) =>
				// Store file stats, get hash of HEAD commit.
				(statInfo = stats, this.getWorkingHead())
			).then((head: HeadInfo) =>
				// Get info for HEAD commit.
				this.getCommit(head.hash)
			).then((info: CommitInfo) =>
				// Get info for given file in git inside HEAD commit.
				this.findPath(info.tree, pathName)
			).then((info: FileInfo) =>
				// Store info for file in git, get hash of file in working copy.
				(fileInfo = info, getHash(
					'sha1',
					fs.createReadStream(pathName),
					'blob ' + statInfo.size + '\0'
				))
			).then((workingFileHash: string) =>
				// Compare hashes between file in HEAD commit and working copy.
				fileInfo.hash != workingFileHash
			).catch(() =>
				// On error (file is missing from version control or working copy,
				// or something went wrong) assume the file is dirty.
				true
			)
		);
	}

	/** Walk the commit log from given hash towards the initial commit,
	  * calling handler for each commit matching options. */

	walkLog(commitHash: string, options: GetLogOptions, handler: (entry: CommitInfo) => void): Promise<void> {
		options = options || {} as GetLogOptions;

		var count = options.count || Infinity;
		var entryPrev: CommitInfo;
		var hashPrev: string;

		var helper = (
			walker: { read: (cb: (err: any, entry: CommitInfo) => void) => void, abort: (cb: any) => void },
			resolve: () => void
		) => {
			walker.read((err: any, entry: CommitInfo) => {
				if(!entry) {
					if(entryPrev) handler(entryPrev);
					resolve();
				} else if(options.path) {
					this.findPath(entry.tree, options.path).then((info: FileInfo) => {
						var fileHash = info.hash;
						if(fileHash != hashPrev && entryPrev) handler(entryPrev), --count;

						entryPrev = entry;
						hashPrev = fileHash;

						if(fileHash && count) helper(walker, resolve);
						else resolve();
					})
				} else {
					handler(entry), --count;
					if(count) helper(walker, resolve);
					else resolve();
				}
			});
		};

		return(
			this.repo.logWalkAsync(commitHash).then((walker: any) =>
				new Promise((resolve: () => void, reject: (err: any) => void) =>
					helper(walker, resolve)
				)
			)
		);
	}

	/** Get promise resolving to a list of commits matching options,
	  * in reverse topological / chronological order
	  * from given hash towards the initial commit. */

	getLog(hash: string, options?: GetLogOptions) {
		var result: CommitInfo[] = [];

		return(this.walkLog(hash, options, (entry: CommitInfo) => result.push(entry)).then(() => result));
	}

	private basePath: string;
	private repoPath: string;
	private repo: any = {};
}
