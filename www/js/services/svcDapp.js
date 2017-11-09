angular.module('leth.services')
.service('DappService', function ($rootScope, $http, $q, $timeout, 
                                $ionicPopup, $ionicPlatform, $ionicLoading, $ionicSideMenuDelegate, 
                                $ionicSlideBoxDelegate, $ionicScrollDelegate, $ionicActionSheet,
                                $cordovaBarcodeScanner, $cordovaGeolocation,
                                AppService, Chat, ENSService, ExchangeService, 
                                Friends, nfcService, SwarmService, BEService) {
  return{
    q: function(){
      return $q;
    },
    ENS_getAddress: function(name){
      return ENSService.getAddress(name);
    },
    exit: function(){
      $rootScope.$ionicGoBack();
    },
    storeData: function(GUID,key,value){
      BEService.storeData(GUID,key,value);
    },
    clearData: function(GUID,key){
      BEService.clearData(GUID,key);
    },
    getKey: function (GUID,key) {
      return BEService.getKey(GUID,key);
    },
    removeKey: function(GUID,key){
      BEService.removeKey(GUID,key);
    },
    contractNew: function(params, abi, datacode, gasLimit, fee){
      return AppService.contractNew(params, abi, datacode, gasLimit, fee);
    },
    address: function(){
      return AppService.account();
    },
    idkey: function(){
      return AppService.idkey();
    },
    balance: function(){
      return AppService.balance(1.0e18);
    },
    swarmUpload: function(content){
      SwarmService.upload(content).then(function(res){
        console.log(res);
      }); 
    },
    swarmDownload: function(hash){
      SwarmService.download(hash).then(function(res){
        console.log(res);
        return res;
      }).catch(console.log);
    },
    readMessages: function(){
        return Chat.findDAPP(); 
    },
    sendMessage: function(id,sender,message){
    	var payload = {from: sender, text: message};
    	Chat.sendDappMessage(payload,id);
    },
    transactionCall: function(contract, fname, params, value, gasLimit, gasPrice){
      return AppService.transactionCall(contract, fname, params, value, gasLimit, gasPrice);
    },
    transactionCallNoParam: function(contract, fname, value, gasLimit, gasPrice){
      return AppService.transactionCallNoParam(contract, fname, value, gasLimit, gasPrice);
    },
    popupConfirm: function(txtTitle, txtTemplate){
      var q = $q.defer();
      
      var confirmPopup = $ionicPopup.confirm({
        title: txtTitle,
        template: txtTemplate
      });

      confirmPopup.then(function(res) {
        if(res)
          q.resolve(res);
        else
          q.reject(res);
       });
      
      return q.promise;
    },
    popupPrompt: function(txtTitle, txtSubtitle, inputType, inputPlaceholder){
      var q = $q.defer();
    
      var promptPopup = $ionicPopup.prompt({
        title: txtTitle,
        subTitle: txtSubtitle,
        inputType: inputType,
        inputPlaceholder: inputPlaceholder
      });

      promptPopup.then(function(res,err) {
        if(res)
            q.resolve(res);
        else
            q.reject(err);
       });
      
      return q.promise;
    },
    popupAlert: function(txtTitle, txtTemplate){
      var q = $q.defer();
      
      var alertPopup = $ionicPopup.alert({
        title: txtTitle,
        template: txtTemplate
      });

      alertPopup.then(function(res) {
        if(res)
          q.resolve(res);
        else
          q.reject(res);
       });
      
      return q.promise;
    },
    scanQR : function(){
      var q = $q.defer();

      $ionicPlatform.ready(function () {
        if($rootScope.deviceready){
          $cordovaBarcodeScanner
          .scan()
          .then(function (barcodeData) {
            if(barcodeData.text!= ""){
              console.log('read code: ' + barcodeData.text);
              q.resolve(barcodeData.text);
            }
          }, function (error) {
            // An error occurred
            console.log('Error!' + error);
            q.reject(error);
          });
        }
      });
      return q.promise;
    },
    closeOptionButtons: function(){
      $ionicListDelegate.closeOptionButtons();
    },
    actionSheet: function(){
      return $ionicActionSheet;
    },
    loadingOn: function(){
      $ionicLoading.show();
    },
    loadingOff: function(){
      $ionicLoading.hide();
    },
    loadingFade: function(content,elapsed){
      $ionicLoading.show({template: content, duration: elapsed});
    },
    nextSlide: function() {
      $ionicSlideBoxDelegate.next();
    },
    prevSlide: function() {
      $ionicSlideBoxDelegate.previous();
    },
    toggleLeft: function() {
      $ionicSideMenuDelegate.toggleLeft();
    },
    toggleRight: function() {
      $ionicSideMenuDelegate.toggleRight();
    },
    getPosition: function(){
      var q = $q.defer();

      $cordovaGeolocation
      .getCurrentPosition()
        .then(function (position) {
          console.log(position);
          q.resolve(position)
        }, function (err) {
            q.reject();
        });
      return q.promise;
    }

  }
})