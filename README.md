ts-git
======

[![build status](https://travis-ci.org/charto/ts-git.svg?branch=master)](http://travis-ci.org/charto/ts-git)
[![dependency status](https://david-dm.org/charto/ts-git.svg)](https://david-dm.org/charto/ts-git)
[![npm version](https://img.shields.io/npm/v/ts-git.svg)](https://www.npmjs.com/package/ts-git)

This is a compact high-level JavaScript API for git. No git installation is needed.
It wraps the low-level [js-git](https://github.com/creationix/js-git) API to investigate
working copies of repositories stored in the local filesystem, much like the `git`
command line tool is often used.

Features
--------

The main high-level operations are:

- Get info (hash, message, time and author) for any commit ([`getCommit`](#api-Git-getCommit)).
- Get logs with commit info working backwards from any commit ([`getLog`](#api-Git-getLog)).
  - Optionally filtered to only include commits with changes to a particular file (stopping at renames).
- Check if a particular file in the working tree has changed since the latest commit ([`isDirty`](#api-Git-isDirty)).

API
===
Docs generated using [`docts`](https://github.com/charto/docts)
>
> <a name="api-CommitInfo"></a>
> ### Interface [`CommitInfo`](#api-CommitInfo)
> Source code: [`<>`](http://github.com/charto/ts-git/blob/d42cf28/src/Git.ts#L30-L37)  
>  
> Properties:  
> > **.tree** <sup><code>string</code></sup>  
> > **.parents** <sup><code>string[]</code></sup>  
> > **.author** <sup><code>[UserTimeInfo](#api-UserTimeInfo)</code></sup>  
> > **.committer** <sup><code>[UserTimeInfo](#api-UserTimeInfo)</code></sup>  
> > **.message** <sup><code>string</code></sup>  
> > **.hash** <sup><code>string</code></sup>  
>
> <a name="api-FileInfo"></a>
> ### Interface [`FileInfo`](#api-FileInfo)
> Source code: [`<>`](http://github.com/charto/ts-git/blob/d42cf28/src/Git.ts#L19-L22)  
>  
> Properties:  
> > **.mode** <sup><code>number</code></sup>  
> > **.hash** <sup><code>string</code></sup>  
>
> <a name="api-GetLogOptions"></a>
> ### Interface [`GetLogOptions`](#api-GetLogOptions)
> <em>Filtering options for retrieving logs.</em>  
> Source code: [`<>`](http://github.com/charto/ts-git/blob/d42cf28/src/Git.ts#L12-L17)  
>  
> Properties:  
> > **.path**<sub>?</sub> <sup><code>string</code></sup>  
> > &emsp;<em>Only match commits where file at path was changed.</em>  
> > **.count**<sub>?</sub> <sup><code>number</code></sup>  
> > &emsp;<em>Only match up to given number of commits.</em>  
>
> <a name="api-Git"></a>
> ### Class [`Git`](#api-Git)
> Source code: [`<>`](http://github.com/charto/ts-git/blob/d42cf28/src/Git.ts#L59-L252)  
>  
> Methods:  
> > **new( )** <sup>&rArr; <code>[Git](#api-Git)</code></sup> [`<>`](http://github.com/charto/ts-git/blob/d42cf28/src/Git.ts#L60-L68)  
> > &emsp;&#x25aa; basePath <sup><code>string</code></sup>  
> > **.getWorkingHead( )** <sup>&rArr; <code>Bluebird&lt;[HeadInfo](#api-HeadInfo)&gt;</code></sup> [`<>`](http://github.com/charto/ts-git/blob/d42cf28/src/Git.ts#L72-L104)  
> > &emsp;<em>Get promise resolving to the hash of current working tree HEAD commit.</em>  
> > **.getCommit( )** <sup>&rArr; <code>Bluebird&lt;[CommitInfo](#api-CommitInfo)&gt;</code></sup> [`<>`](http://github.com/charto/ts-git/blob/d42cf28/src/Git.ts#L108-L112)  
> > &emsp;<em>Get info for commit based on its hash.</em>  
> > &emsp;&#x25aa; commitHash <sup><code>string</code></sup>  
> > **.resolve( )** <sup>&rArr; <code>string</code></sup> [`<>`](http://github.com/charto/ts-git/blob/d42cf28/src/Git.ts#L116-L118)  
> > &emsp;<em>Get absolute path to file inside working copy.</em>  
> > &emsp;&#x25aa; pathName <sup><code>string</code></sup>  
> > **.relative( )** <sup>&rArr; <code>string</code></sup> [`<>`](http://github.com/charto/ts-git/blob/d42cf28/src/Git.ts#L122-L124)  
> > &emsp;<em>Get path to file inside working copy relative to its root.</em>  
> > &emsp;&#x25aa; pathName <sup><code>string</code></sup>  
> > **.findPath( )** <sup>&rArr; <code>Bluebird&lt;[FileInfo](#api-FileInfo)&gt;</code></sup> [`<>`](http://github.com/charto/ts-git/blob/d42cf28/src/Git.ts#L129-L146)  
> > &emsp;<em>Get info for file at pathName inside tree. Tree is a hash</em>  
> > &emsp;<em>pointing to the contents of a commit, defined in the commit's info.</em>  
> > &emsp;&#x25aa; treeHash <sup><code>string</code></sup>  
> > &emsp;&#x25aa; pathName <sup><code>string</code></sup>  
> > **.isDirty( )** <sup>&rArr; <code>Bluebird&lt;boolean&gt;</code></sup> [`<>`](http://github.com/charto/ts-git/blob/d42cf28/src/Git.ts#L151-L184)  
> > &emsp;<em>Get promise resolving to true if file inside working tree is dirty,</em>  
> > &emsp;<em>false otherwise.</em>  
> > &emsp;&#x25aa; pathName <sup><code>string</code></sup>  
> > **.walkLog( )** <sup>&rArr; <code>Bluebird&lt;void&gt;</code></sup> [`<>`](http://github.com/charto/ts-git/blob/d42cf28/src/Git.ts#L189-L237)  
> > &emsp;<em>Walk the commit log from given hash towards the initial commit,</em>  
> > &emsp;<em>calling handler for each commit matching options.</em>  
> > &emsp;&#x25aa; commitHash <sup><code>string</code></sup>  
> > &emsp;&#x25aa; options <sup><code>[GetLogOptions](#api-GetLogOptions)</code></sup>  
> > &emsp;&#x25aa; handler <sup><code>(entry: CommitInfo) =&gt; void</code></sup>  
> > **.getLog( )** <sup>&rArr; <code>Bluebird&lt;[CommitInfo](#api-CommitInfo)[]&gt;</code></sup> [`<>`](http://github.com/charto/ts-git/blob/d42cf28/src/Git.ts#L243-L247)  
> > &emsp;<em>Get promise resolving to a list of commits matching options,</em>  
> > &emsp;<em>in reverse topological / chronological order</em>  
> > &emsp;<em>from given hash towards the initial commit.</em>  
> > &emsp;&#x25aa; hash <sup><code>string</code></sup>  
> > &emsp;&#x25ab; options<sub>?</sub> <sup><code>[GetLogOptions](#api-GetLogOptions)</code></sup>  
>
> <a name="api-HeadInfo"></a>
> ### Interface [`HeadInfo`](#api-HeadInfo)
> Source code: [`<>`](http://github.com/charto/ts-git/blob/d42cf28/src/Git.ts#L39-L42)  
>  
> Properties:  
> > **.branch**<sub>?</sub> <sup><code>string</code></sup>  
> > **.hash**<sub>?</sub> <sup><code>string</code></sup>  
>
> <a name="api-UserTimeInfo"></a>
> ### Interface [`UserTimeInfo`](#api-UserTimeInfo)
> Source code: [`<>`](http://github.com/charto/ts-git/blob/d42cf28/src/Git.ts#L24-L28)  
>  
> Properties:  
> > **.name** <sup><code>string</code></sup>  
> > **.email** <sup><code>string</code></sup>  
> > **.date** <sup><code>{ seconds: number; offset: number; }</code></sup>  
>
> <a name="api-getHash"></a>
> ### Function [`getHash`](#api-getHash)
> <em>Get promise resolving to desired type of hash (eg. sha1) for contents of stream.</em>  
> <em>Optionally prefix contents with an arbitrary header before hashing.</em>  
> Source code: [`<>`](http://github.com/charto/ts-git/blob/d42cf28/src/Git.ts#L47-L57)  
> > **getHash( )** <sup>&rArr; <code>Bluebird&lt;string&gt;</code></sup> [`<>`](http://github.com/charto/ts-git/blob/d42cf28/src/Git.ts#L47-L57)  
> > &emsp;&#x25aa; type <sup><code>string</code></sup>  
> > &emsp;&#x25aa; dataStream <sup><code>Readable</code></sup>  
> > &emsp;&#x25ab; prefix<sub>?</sub> <sup><code>string</code></sup>  

License
=======

[The MIT License](https://raw.githubusercontent.com/charto/ts-git/master/LICENSE)

Copyright (c) 2016 BusFaster Ltd
