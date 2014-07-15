redis-lock
==========

Redis distributed lock across multiple instances/servers using [setnx](http://redis.io/commands/setnx)

  [![NPM version][npm-image]][npm-url]
  [![build status][travis-image]][travis-url]
  [![Test coverage][coveralls-image]][coveralls-url]

# Requirements

	- Redis 2.6.12

# Install

```
npm install
```


# Examples

```javascript

var lock = require('redis')
```

# API

Both methods return promises.

## acquire (key, options)

	Take the lock and avoid others to take it.

	`key` is a string key identifying the lock

### options

	`ttl` Lock time to live in microseconds (will be automatically released after that time)

	`timeout` Time trying to get lock before (ms)

	`wait` Time between 2 tries getting lock (ms)

## release (key)

	Release the lock for others.

	`key` string identifying the lock

## isLocked (key)

	Tells if the lock is taken.

	`key` string identifying the lock

	returns `true` or `false`

## renew (key, ttl)

	`key` string identifying the lock

	`ttl` new lock time-to-live in ms


# License

  MIT


[npm-image]: https://img.shields.io/npm/v/redis-locking.svg?style=flat
[npm-url]: https://npmjs.org/package/redis-locking
[travis-image]: https://img.shields.io/travis/pierreinglebert/redis-lock.svg?style=flat
[travis-url]: http://travis-ci.org/pierreinglebert/redis-lock
[coveralls-image]: https://img.shields.io/coveralls/pierreinglebert/redis-lock.svg?style=flat
[coveralls-url]: https://coveralls.io/r/pierreinglebert/redis-lock?branch=master
