global class CurrencyCoversion {
    @AuraEnabled (cacheable = true)
   webservice static Integer getCurrencyCodeCoversion(String currencyCode1, String currencyCode2){
    Integer conversionNumber = 0;
    String RATES = 'rates';
    Http http = new Http();
    HttpRequest request = new HttpRequest();
    request.setEndpoint('https://open.er-api.com/v6/latest/'+currencyCode1);
    request.setMethod('GET');
    HttpResponse  response = http.send(request);
    if(response.getStatusCode() == 200){
        Map<String,Object> responsetable = (Map<String,Object>)JSON.deserializeUntyped(response.getBody());
        Map<String,Object> resulttable = (Map<String,Object>)responsetable.get(RATES);
        conversionNumber = Integer.valueOf(resulttable.get(currencyCode2));
    }
    System.debug(conversionNumber);
    return conversionNumber;
   }
}