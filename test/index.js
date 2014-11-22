'use strict';

var assert = require('chai').assert;
var redis = require('redis');

var lock;

var lockKey = 'testlock';

describe('Lock', function() {
  before(function(done) {
    var client = redis.createClient();
    lock = require('../index')(client);
    client.del(lockKey);
    client.on('connect', function () {
      done();
    });
  });

  describe('acquire', function() {
    it('should lock the resource', function(done) {
      var gotLock = false;

      lock.acquire(lockKey, {ttl: 300})
      .then(function() {
        lock.acquire(lockKey, {ttl: 300})
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
      lock.acquire(lockKey, {ttl: 300})
      .then(function() {
        var start = new Date().getTime();
        lock.acquire(lockKey, {ttl: 300})
        .then(function() {
          var now = new Date().getTime();
          assert.isTrue(now - start > 290 && now - start < 350);
          done();
        });
      });
    });

    it('should timeout trying to get lock for too long', function(done) {
      var error = null;
      lock.acquire(lockKey, {ttl: 300})
      .then(function() {
        return lock.acquire(lockKey, {ttl: 200, timeout: 200});
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
      lock.acquire(lockKey, {ttl: 500})
      .then(function() {
        start = new Date().getTime();
        return lock.release(lockKey);
      })
      .then(function() {
        return lock.acquire(lockKey, {ttl: 50});
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
      lock.acquire(lockKey, {ttl: 200})
      .then(lock.isLocked)
      .then(assert.isTrue)
      .then(function() {
        return lock.release(lockKey);
      })
      .then(function() {
        done();
      });
    });
    it('should return false if free', function(done) {
      lock.isLocked(lockKey)
      .then(assert.isFalse)
      .then(function() {
        done();
      });
    });
  });

  describe('renew', function() {
    it('should renew a lock', function(done) {
      var start = new Date().getTime();
      lock.acquire(lockKey, {ttl: 200})
      .then(function() {
        return lock.renew(lockKey, 500);
      })
      .then(function() {
        return lock.acquire(lockKey, {ttl: 10});
      })
      .then(function() {
        var now = new Date().getTime();
        assert.isTrue(now - start > 450 && now - start < 550);
        done();
      });
    });
  });
});
