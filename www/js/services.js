angular.module('leth.services', [])
  .factory('Friends', function ($rootScope, $http, $q) {
    return {
      all: function () {
        return JSON.parse(localStorage.Friends);
      },
      add: function(addressbook,user) {
        if(Array.isArray(addressbook))
          addressbook.push(user);
        return addressbook;
      },
      get: function(address) {
        var addressbook = JSON.parse(localStorage.Friends);
        var obj = addressbook.filter(function (val) {
          return val.addr === address;
        });
        return obj[0];         
      },
      remove: function(addressbook, index) {
        addressbook.splice(index, 1);
        return addressbook;
      },
      increaseUnread: function(address) {
        var addressbook = JSON.parse(localStorage.Friends);
        addressbook.filter(function (val) {
          if(val.addr === address){
            val.unread+=1;
            localStorage.Friends = JSON.stringify(addressbook);
          }
        });
      },      
      clearUnread: function(address) {
        var addressbook = JSON.parse(localStorage.Friends);
        addressbook.filter(function (val) {
          if(val.addr === address)
            val.unread=0;

          localStorage.Friends = JSON.stringify(addressbook);
        });
      },      
      balance: function (friend) {
        var result;
        try {
          result = (parseFloat(web3.eth.getBalance(friend.addr)) / 1.0e18).toFixed(6);
        }catch (e){
          result = undefined;
        }
        return result
      }
    };
  })
  .factory('Chat', function ($rootScope, $http, $q, AppService, Friends) {
    var identity ="0x";
    var chats=[];
    var chatsDM=[];
    var topics = ["leth"];
    var filter =  null;
    var _decryptMessage = function(result){
        lightwallet.keystore.deriveKeyFromPassword(JSON.parse(localStorage.AppCode).code, function (err, pwDerivedKey) {
          result.payload.text = lightwallet.encryption.multiDecryptString(local_keystore,pwDerivedKey,result.payload.text, result.payload.senderKey,local_keystore.getPubKeys(hdPath)[0],hdPath);
          
          return result;
        });
    };
    return{
      identity: function(){
        if(!web3.shh.hasIdentity(identity)){
          identity = web3.shh.newIdentity();
          //topics.push(identity);
        }
        return identity;
      },
      find: function(){
        return chats;
      },
      findDM: function(){
        return chatsDM;
      },
      addTopic: function(t){
        topics.push(t);
      },
      removeTopic: function(t){
        topics.pop(t);
        
      },
      listTopics: function(){
        var list = JSON.parse( JSON.stringify( topics ) );
        list.pop("leth"); //base topic uneditable 
        return list;
      },      
      sendMessage: function (msg) {
        var payload = msg;
        var message = {
          from:  this.identity(),
          topics: topics,
          payload: payload,
          ttl: 100,
          workToProve: 100
        };
        web3.shh.post(message); 

        chats.push({
          identity: blockies.create({ seed: payload.from}).toDataURL("image/jpeg"),
          timestamp: Date.now(),
          message: payload, 
          from: message.payload.from,
          to: null,
          read: false
        });
      },
      sendCryptedMessage: function (content,toAddr,toKey) {
        var msg = {type: 'leth', mode: 'encrypted', from: AppService.account(), to: [toAddr,AppService.account()] , senderKey: local_keystore.getPubKeys(hdPath)[0] , text: content, image: '' };
        var idFrom = this.identity();
        var payload = msg;
        var message = {
          from:  idFrom,
          topics: topics,
          payload: payload,
          ttl: 100,
          workToProve: 100
        };

        chatsDM.push({
            identity: blockies.create({ seed: payload.from}).toDataURL("image/jpeg"),
            timestamp: Date.now(),
            message: payload, 
            from: payload.from,
            to: payload.to,
            read: false
          });

        lightwallet.keystore.deriveKeyFromPassword(JSON.parse(localStorage.AppCode).code, function (err, pwDerivedKey) {
          var crptMsg = angular.copy(message);

          crptMsg.payload.text = lightwallet.encryption.multiEncryptString(local_keystore,pwDerivedKey,content,local_keystore.getPubKeys(hdPath)[0],[toKey.replace("0x",""),local_keystore.getPubKeys(hdPath)[0]],hdPath);

          web3.shh.post(crptMsg); 
        });
      },
      sendCryptedPhoto: function (content,toAddr,toKey) {
        var msg = {type: 'leth', mode: 'encrypted', from: AppService.account(), to: [toAddr,AppService.account()] , senderKey: local_keystore.getPubKeys(hdPath)[0] , text: '', image: content };
        var idFrom = this.identity();
        var payload = msg;
        var message = {
          from:  idFrom,
          topics: topics,
          payload: payload,
          ttl: 100,
          workToProve: 100
        };

        chatsDM.push({
            identity: blockies.create({ seed: payload.from}).toDataURL("image/jpeg"),
            timestamp: Date.now(),
            message: payload, 
            from: payload.from,
            to: payload.to,
            read: false
          });

        lightwallet.keystore.deriveKeyFromPassword(JSON.parse(localStorage.AppCode).code, function (err, pwDerivedKey) {
          var crptMsg = angular.copy(message);

          crptMsg.payload.image = lightwallet.encryption.multiEncryptString(local_keystore,pwDerivedKey,content,local_keystore.getPubKeys(hdPath)[0],[toKey.replace("0x",""),local_keystore.getPubKeys(hdPath)[0]],hdPath);

          web3.shh.post(crptMsg); 
        });
      },
      sendNote: function (transaction) {
        var note = {type: 'leth', mode: 'note', from: AppService.account(), to: [transaction.to,AppService.account()], text: (transaction.value / 1.0e18).toFixed(6)+ ' Ξ sent', image: '', attach: transaction };
        
        var payload = note;
        var message = {
          from:  this.identity(),
          topics: topics,
          payload: payload,
          ttl: 100,
          workToProve: 100
        };
        web3.shh.post(message); 

        chatsDM.push({
          identity: blockies.create({ seed: payload.from}).toDataURL("image/jpeg"),
          timestamp: Date.now(),
          message: payload, 
          from: message.payload.from,
          to: null,
          read: false
        });
      },      
      encryptMessage: function (msg,toAddr,toKey) {
        lightwallet.keystore.deriveKeyFromPassword(JSON.parse(localStorage.AppCode).code, function (err, pwDerivedKey) {
          textMsg = lightwallet.encryption.multiEncryptString(local_keystore,pwDerivedKey,textMsg, local_keystore.getPubKeys(hdPath)[0],[toKey.replace("0x",""),local_keystore.getPubKeys(hdPath)[0]],hdPath);

          var msg = {type: 'leth', mode: 'encrypted', from: AppService.account(), to: [toAddr,AppService.account()] , senderKey: local_keystore.getPubKeys(hdPath)[0] , text: textMsg, image: '' };

          return msg;    
        });
        return false;
      },
      listenMessage: function($scope){
        filter =  web3.shh.filter({topics: [topics]});
        filter.watch(function (error, result) {
          if(error){return;};
          if(result.payload.from == AppService.account()){return;}
          if(result.payload.mode == 'encrypted'){
 
            lightwallet.keystore.deriveKeyFromPassword(JSON.parse(localStorage.AppCode).code, function (err, pwDerivedKey) {
              if(result.payload.text != '')
                result.payload.text = lightwallet.encryption.multiDecryptString(local_keystore,pwDerivedKey,result.payload.text, result.payload.senderKey,local_keystore.getPubKeys(hdPath)[0],hdPath);
              if(result.payload.image != '')
                result.payload.image = lightwallet.encryption.multiDecryptString(local_keystore,pwDerivedKey,result.payload.image, result.payload.senderKey,local_keystore.getPubKeys(hdPath)[0],hdPath);

              chatsDM.push({
                  identity: blockies.create({ seed: result.payload.from}).toDataURL("image/jpeg"),
                  timestamp: result.sent*1000,
                  message: result.payload, 
                  from: result.payload.from,
                  to: result.payload.to,
                  read: false
                });

                $scope.$broadcast("incomingMessage", result);              
            });
          };
          if(result.payload.mode == 'plain'){
            if(result.payload.from != AppService.account()){
              chats.push({
                identity: blockies.create({ seed: result.payload.from}).toDataURL("image/jpeg"),
                timestamp: result.sent*1000,
                message: result.payload, 
                from: result.payload.to,
                to: null,
                read: false
              });
              
              $scope.$broadcast("incomingMessage", result);
            }//exclude self sent              
          };
          if(result.payload.mode == 'note'){
            if(result.payload.from != AppService.account()){

              chatsDM.push({
                identity: blockies.create({ seed: result.payload.from}).toDataURL("image/jpeg"),
                timestamp: result.sent*1000,
                message: result.payload, 
                from: result.payload.to,
                to: null,
                read: false
              });
              
              $scope.$broadcast("incomingMessage", result);
            }//exclude self sent              
          }          
        });
      },
      unlistenMessage: function(){
        if(filter!=null)
          filter.stopWatching();
      }
    }
  })
  .service('AppService', function ($rootScope, $http, $q) {
    return {
      getStore: function(){
        $http.get('http://www.inzhoop.com/dappleths/Store.json').then(function(response){
          return response.data;
        });
      },
      getStoreApps: function () {
        var q = $q.defer();
        $http({
          method: 'GET',
          url: 'http://www.inzhoop.com/dappleths/Store.json'
        }).then(function(response) {
          q.resolve(response.data);
        }, function(response) {
          q.reject(response);
        });
        return q.promise;
      },
      getHostHood: function () {
        var q = $q.defer();
        $http({
          method: 'GET',
          url: 'https://www.ethernodes.org/network/1/data?draw=1&columns[0][data]=id&columns[1][data]=host&columns[1][orderable]=true&order[0][column]=0&order[0][dir]=asc&start=0&length=10000&search[value]=&search[regex]=false'
        }).then(function(response) {
          q.resolve(response.data.data);
        }, function(response) {
          q.reject(response);
        });
        return q.promise;
      },
       checkHostHood: function (host) {
        var q = $q.defer();
        $http({
          method: 'GET',
          url: host
        }).then(function(response) {
          if(response.status==200)
            q.resolve(response.data);
        }, function(response) {
          q.reject(response);
        });
        return q.promise;
      },      
      setWeb3Provider: function (keys) {
        var web3Provider = new HookedWeb3Provider({
          host: localStorage.NodeHost,
          transaction_signer: keys
        });
        web3.setProvider(web3Provider);
        return true;
      },
      account: function () {
        var result;
        try {
          result = "0x" + global_keystore.getAddresses()[0];
        }catch(e) {
          result = undefined;
        }
        return result;
      },
      idkey: function () {
        var result;
        try {
          result = "0x" + local_keystore.getPubKeys(hdPath)[0];
        }catch(e) {
          result = undefined;
        }
        return result;
      },

      balance: function () {
        var result;
        try {
          result = (parseFloat(web3.eth.getBalance(this.account())) / 1.0e18).toFixed(6);
        }catch (e){
          result = undefined;
        }
        return result
      },
      transferCoin: function (contract, nameSend, from, to, amount ) {
          var fromAddr = '0x' + from;
          var toAddr = to;
          var functionName = nameSend;
          var args = JSON.parse('[]');
          var gasPrice = web3.eth.gasPrice;
          var gas = 3000000;
          args.push(toAddr,amount,{from: fromAddr, gasPrice: gasPrice, gas: gas});
          var callback = function (err, txhash) {
              console.log('error: ' + err);
              console.log('txhash: ' + txhash);
          }
          args.push(callback);
          contract[functionName].apply(this, args);
          return true;
      },
      loginSesamo: function(address,sessionId){
        var tokenAdr = "0xd42fda38922b5da5b3bd0b8bed6ac4cbd68c2f05";
        var tokenABI = [{"constant":true,"inputs":[],"name":"name","outputs":[{"name":"","type":"string"}],"type":"function"},{"constant":true,"inputs":[],"name":"decimals","outputs":[{"name":"","type":"uint8"}],"type":"function"},{"constant":false,"inputs":[{"name":"site","type":"address"},{"name":"sessionId","type":"string"}],"name":"loginToSite","outputs":[],"type":"function"},{"constant":true,"inputs":[],"name":"version","outputs":[{"name":"","type":"string"}],"type":"function"},{"constant":true,"inputs":[{"name":"","type":"address"}],"name":"balanceOf","outputs":[{"name":"","type":"uint256"}],"type":"function"},{"constant":true,"inputs":[],"name":"symbol","outputs":[{"name":"","type":"string"}],"type":"function"},{"constant":false,"inputs":[{"name":"_to","type":"address"}],"name":"returnTo","outputs":[],"type":"function"},{"constant":false,"inputs":[{"name":"_to","type":"address"}],"name":"endBalance","outputs":[],"type":"function"},{"constant":false,"inputs":[{"name":"_to","type":"address"}],"name":"startBalance","outputs":[],"type":"function"},{"constant":false,"inputs":[{"name":"sesamoAddr","type":"address"}],"name":"linkSesamo","outputs":[],"type":"function"},{"inputs":[{"name":"tokenName","type":"string"},{"name":"decimalUnits","type":"uint8"},{"name":"tokenSymbol","type":"string"},{"name":"versionOfTheCode","type":"string"}],"type":"constructor"},{"anonymous":false,"inputs":[{"indexed":true,"name":"from","type":"address"},{"indexed":true,"name":"to","type":"address"},{"indexed":false,"name":"value","type":"uint256"}],"name":"Transfer","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"name":"msg","type":"string"},{"indexed":false,"name":"value","type":"string"},{"indexed":false,"name":"addr","type":"address"}],"name":"Log","type":"event"}];
        var sesamoToken = web3.eth.contract(tokenABI).at(tokenAdr);

        var sesamoAdr = "0x354c1c7cd264fc6373829619af11bcb364f5f388";
        var sesamoABI = [{"constant":false,"inputs":[{"name":"site","type":"address"},{"name":"sessionId","type":"string"}],"name":"login","outputs":[],"type":"function"},{"constant":false,"inputs":[{"name":"site","type":"address"},{"name":"addr","type":"address"}],"name":"enable","outputs":[],"type":"function"},{"constant":true,"inputs":[{"name":"index","type":"uint256"}],"name":"getSite","outputs":[{"name":"u","type":"address"}],"type":"function"},{"constant":true,"inputs":[],"name":"getSitesCount","outputs":[{"name":"count","type":"uint256"}],"type":"function"},{"constant":false,"inputs":[{"name":"site","type":"address"}],"name":"removeSite","outputs":[],"type":"function"},{"constant":false,"inputs":[{"name":"site","type":"address"}],"name":"reset","outputs":[],"type":"function"},{"constant":true,"inputs":[{"name":"site","type":"address"}],"name":"getUsersCount","outputs":[{"name":"count","type":"uint256"}],"type":"function"},{"constant":false,"inputs":[{"name":"site","type":"address"}],"name":"addSite","outputs":[],"type":"function"},{"constant":false,"inputs":[{"name":"newOwner","type":"address"}],"name":"promoteOwner","outputs":[],"type":"function"},{"constant":false,"inputs":[{"name":"site","type":"address"},{"name":"addr","type":"address"}],"name":"disable","outputs":[],"type":"function"},{"constant":true,"inputs":[{"name":"site","type":"address"},{"name":"index","type":"uint256"}],"name":"getUser","outputs":[{"name":"u","type":"address"}],"type":"function"},{"inputs":[{"name":"sesamoTokenAddr","type":"address"}],"type":"constructor"},{"anonymous":false,"inputs":[{"indexed":false,"name":"addr","type":"address"},{"indexed":false,"name":"sessionId","type":"string"}],"name":"AuthOK","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"name":"addr","type":"address"},{"indexed":false,"name":"sessionId","type":"string"}],"name":"AuthKO","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"name":"msg","type":"string"},{"indexed":false,"name":"value","type":"string"},{"indexed":false,"name":"addr","type":"address"}],"name":"Log","type":"event"}]
        var sesamoLogin = web3.eth.contract(sesamoABI).at(sesamoAdr);
        
        var fromAddr = this.account();
        var toAddr = address;
        var functionName = 'loginToSite';
        var args = JSON.parse('[]');
        var gasPrice = 50000000000;
        var gas = 3000000;
        args.push(toAddr,sessionId,{from: fromAddr, gasPrice: gasPrice, gas: gas});
        var callback = function (err, txhash) {
            console.log('error: ' + err);
            console.log('txhash: ' + txhash);
        }
        args.push(callback);
        sesamoToken[functionName].apply(this, args);
        return true;
      },
      loginTest: function(address,sessionId){
        var contractAdr = "0xC1E5dD93D9888d10094128c13efd9D6487452848";
        var contractABI = [ { "constant": false, "inputs": [ { "name": "device", "type": "address" }, { "name": "sessionId", "type": "string" } ], "name": "login", "outputs": [], "type": "function" }, { "anonymous": false, "inputs": [ { "indexed": false, "name": "device", "type": "address" }, { "indexed": false, "name": "sessionId", "type": "string" }, { "indexed": false, "name": "applicant", "type": "address" } ], "name": "AuthOK", "type": "event" }, { "anonymous": false, "inputs": [ { "indexed": false, "name": "device", "type": "address" }, { "indexed": false, "name": "sessionId", "type": "string" }, { "indexed": false, "name": "applicant", "type": "address" } ], "name": "AuthKO", "type": "event" } ];
        var contract = web3.eth.contract(contractABI).at(contractAdr);
        
        var fromAddr = this.account();
        var deviceAddr = address;
        var functionName = 'login';
        var args = JSON.parse('[]');
        var gasPrice = 50000000000;
        var gas = 3000000;
        args.push(deviceAddr,sessionId,{from: fromAddr, gasPrice: gasPrice, gas: gas});
        var callback = function (err, txhash) {
            console.log('error: ' + err);
            console.log('txhash: ' + txhash);
        }
        args.push(callback);
        contract[functionName].apply(this, args);
        return true;
      },
      sendTransaction: function (from, to, value, gasPrice, gas) {
        return $q(function (resolve, reject) {
          try {
            web3.eth.sendTransaction({
              from: from,
              to: to,
              value: value,
              gasPrice: gasPrice,
              gas: gas
            }, function (err, hash) {
              var result = new Array;
              result.push(err);
              result.push(hash);
              resolve(result);
            });
          } catch (e) {
            reject(e);
          }
        });
      }
    }
  })
  .factory('PasswordPopup', function ($rootScope, $q, $ionicPopup) {
    return {
      open: function (msg, defaultMessage) {
        var q = $q.defer();

        $rootScope.secureData = {};

        var myPopup = $ionicPopup.show({
          template: '<input type="password" ng-model="secureData.password" autofocus="true">',
          title: msg,
          subTitle: defaultMessage,
          scope: $rootScope,
          buttons: [
            {text: 'Cancel'},
            {
              text: '<b>Ok</b>',
              type: 'button-positive',
              onTap: function (e) {
                if (!$rootScope.secureData.password) {
                  //don't allow the user to close unless he enters password
                  e.preventDefault();
                } else {
                  return $rootScope.secureData.password;
                }
              }
            }
          ]
        });

        myPopup.then(function (res) {

          q.resolve(res);
        });

        return q.promise;

      }
    }
  })
  .factory('Transactions', function (Chat) {
    var transactions;
    if (localStorage.Transactions != undefined) {
      transactions = JSON.parse(localStorage.Transactions);
    } else {
      transactions = [];
    }

    return {
      all: function () {
        return transactions;
      },
      add: function (t) {
        transactions.push(t);
        localStorage.Transactions = JSON.stringify(transactions);
      },
/*      save: function (from, to, transaction, value, timestamp) {
        var newT = {from: from, to: to, id: transaction, value: value, time: timestamp};
        this.add(newT);
        //send via shh message
        Chat.sendNote(newT);
        return transactions;
      }
*/
    };
  })
  .factory('ExchangeService', function ($q, $http) {
    var assets = [];

    return {
      getAllAssets: function () {
        return assets;
      },
      readAssets: function(){
        var q = $q.defer();
        $http({
          method: 'GET',
          url: 'https://api.kraken.com/0/public/Assets'
        }).then(function(response) {
          q.resolve(response.data);
        }, function(response) {
          q.reject(response);
        });
        return q.promise;
      },
      getTicker: function(coin, pair){
        var q = $q.defer();
        $http({
          method: 'GET',
          url: 'https://api.kraken.com/0/public/Ticker?pair=' + coin + pair
        }).then(function(response) {
          q.resolve(response.data.result[coin + pair]["o"]);
        }, function(response) {
          q.reject(response);
        });
        return q.promise;
      }
    };
  })
  .factory('$localstorage', ['$window', function ($window) {
    return {
      set: function (key, value) {
        $window.localStorage[key] = value;
      },
      get: function (key, defaultValue) {
        return $window.localStorage[key] || defaultValue;
      },
      setObject: function (key, value) {
        $window.localStorage[key] = JSON.stringify(value);
      },
      getObject: function (key) {
        return JSON.parse($window.localStorage[key] || '{}');
      }
    }
  }]);
