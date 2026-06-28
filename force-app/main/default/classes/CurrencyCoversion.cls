global class CurrencyCoversion {

    @AuraEnabled(cacheable=true)
    public static Decimal getCurrencyCodeCoversion(String currencyCode1, String currencyCode2) {
        Decimal conversionRate = 0;
        if (String.isBlank(currencyCode1) || String.isBlank(currencyCode2)) {
            return conversionRate;
        }
        Http http = new Http();
        HttpRequest request = new HttpRequest();
        request.setEndpoint('https://open.er-api.com/v6/latest/' + currencyCode1);
        request.setMethod('GET');
        request.setTimeout(10000);
        HttpResponse response = http.send(request);
        if (response.getStatusCode() == 200) {
            Map<String, Object> responseBody = (Map<String, Object>) JSON.deserializeUntyped(response.getBody());
            Map<String, Object> rates = (Map<String, Object>) responseBody.get('rates');
            if (rates != null && rates.containsKey(currencyCode2)) {
                conversionRate = Decimal.valueOf(String.valueOf(rates.get(currencyCode2)));
            }
        }
        return conversionRate;
    }

    @AuraEnabled(cacheable=true)
    public static Map<String, Object> getCurrencyRateInfo(String currencyCode1, String currencyCode2) {
        Map<String, Object> result = new Map<String, Object>();
        if (String.isBlank(currencyCode1) || String.isBlank(currencyCode2)) {
            return result;
        }
        Http http = new Http();
        HttpRequest request = new HttpRequest();
        request.setEndpoint('https://open.er-api.com/v6/latest/' + currencyCode1);
        request.setMethod('GET');
        request.setTimeout(10000);
        HttpResponse response = http.send(request);
        if (response.getStatusCode() == 200) {
            Map<String, Object> responseBody = (Map<String, Object>) JSON.deserializeUntyped(response.getBody());
            Map<String, Object> rates = (Map<String, Object>) responseBody.get('rates');
            if (rates != null && rates.containsKey(currencyCode2)) {
                result.put('rate', Decimal.valueOf(String.valueOf(rates.get(currencyCode2))));
                result.put('base', currencyCode1);
                result.put('target', currencyCode2);
                result.put('timeLastUpdate', responseBody.get('time_last_update_utc'));
            }
        }
        return result;
    }
}
