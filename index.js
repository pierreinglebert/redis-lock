'use strict';

var crypto = require('crypto');
var Promise = require('bluebird');

// Make the key less prone to collision
var hashKey = function(key) {
  return 'lock:' + crypto.createHash('sha1').update(key).digest('hex');
};

module.exports = function(redis) {
  return {
    /*
    * Tries to get lock and set it
    * @param key : Lock name
    */
    acquire: function(key, options) {
      options = options || {};
      options.ttl = options.ttl || 5000; // Lock time to live in milliseconds
      options.timeout = options.timeout || 5000; // time trying to get local before timeout
      options.wait = options.wait || 30; // time between 2 tries to get lock

      var start = new Date().getTime();
      return new Promise(function(resolve, reject) {
        var tryLock = function() {
          redis.set(hashKey(key), 1, 'PX', options.ttl, 'NX', function(err, res) {
            if(res !== null) {
              //got lock
              resolve(key);
            } else {
              //failed to get lock, try again in a moment
              var now = new Date().getTime();
              if(now - start < options.timeout) {
                setTimeout(tryLock, options.wait);
              } else {
                // Could not get lock in time
                reject(new Error('Locking timeout: Could not get lock in time.'));
              }
            }
          });
        };
        tryLock();
      });
    },
    release: function(key) {
      var del = Promise.promisify(redis.del, redis);
      return del(hashKey(key));
    },
    renew: function(key, ttl) {
      var expire = Promise.promisify(redis.pexpire, redis);
      return expire(hashKey(key), ttl);
    },
    isLocked: function(key) {
      var get = Promise.promisify(redis.get, redis);
      return get(hashKey(key))
      .then(function(value) {
        return parseInt(value, 10) === 1;
      });
    }
  };
};
