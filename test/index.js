'use strict';

var assert = require('chai').assert;
var redis = require('redis');

var lock;

describe('Lock', function() {
	before(function(done) {
		var client = redis.createClient();
		lock = require('../index')(client);
    client.on('connect', function () {
			done();
		});
	});

	describe('acquire', function() {
		it('should lock the resource', function(done) {
			var gotLock = false;

			lock.acquire('testlock', {ttl: 300})
			.then(function() {
				lock.acquire('testlock', {ttl: 300})
				.then(function() {
					gotLock = true;
				});

				setTimeout(function() {
					// should not have taken lock
					assert.isFalse(gotLock);
					done();
				}, 200);
			});
		});

		it('should be released after ttl time', function(done) {
			lock.acquire('testlock', {ttl: 300})
			.then(function() {
				var start = new Date().getTime();
				lock.acquire('testlock', {ttl: 300})
				.then(function() {
					var now = new Date().getTime();
					assert.isTrue(now - start > 290 && now - start < 350);
					done();
				});
			});
		});

		it('should timeout trying to get lock for too long', function(done) {
			var error = null;
			lock.acquire('testlock', {ttl: 300})
			.then(function() {
				return lock.acquire('testlock', {ttl: 200, timeout: 200});
			})
			.catch(function(err) {
				error = err;
			})
			.done(function() {
				assert.isNotNull(error);
				assert.match(error, /timeout/);
				done();
			});
		});
	});

	describe('release', function() {
		it('should release the lock', function(done) {
			var start;
			lock.acquire('testlock', {ttl: 500})
			.then(function() {
				start = new Date().getTime();
				return lock.release('testlock');
			})
			.then(function() {
				return lock.acquire('testlock', {ttl: 50});
			})
			.then(function() {
				var now = new Date().getTime();
				assert.isTrue(now - start < 50);
				done();
			});
		});
	});

	describe('isLocked', function() {
		it('should return true if locked', function(done) {
			lock.acquire('testlock', {ttl: 200})
			.then(lock.isLocked)
			.then(assert.isTrue)
			.then(function() {
				return lock.release('testlock');
			})
			.then(function() {
				done();
			});
		});
		it('should return false if free', function(done) {
			lock.isLocked('testlock')
			.then(assert.isFalse)
			.then(function() {
				done();
			});
		});
	});
});
