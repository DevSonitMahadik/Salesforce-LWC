public class Utility implements Metadata.DeployCallback {
    
    @AuraEnabled(cacheable=true)
    public static Map<String,String> getObjectList(){
        Map<String,String> objectable=new Map<String,String>();
        List<EntityDefinition> objlabels=[SELECT Label, QualifiedApiName 
                                          FROM EntityDefinition
                                            WHERE IsRetrieveable = TRUE
                                            AND IsTriggerable = TRUE
                                            AND IsQueryable = TRUE
                                            AND IsEverUpdatable = TRUE
                                            AND IsSearchable = TRUE
                                            AND IsEverCreatable = TRUE
                                            AND IsCustomSetting = FALSE
                                            AND IsApexTriggerable = TRUE
                                            ORDER BY Label ASC LIMIT 49999];
            for(EntityDefinition result:objlabels){
                objectable.put(result.Label,result.QualifiedApiName);
            }
        return objectable;
    }
    @AuraEnabled(cacheable=true)
    public static Map<String,String> getObjectFields(String ObjectApiName){
        //List<String> fieldNames = new List<String>();
        Map<String,String> fieldApiNameWithType=new Map<String,String>();
        // * Getting metadata of all sObjects
        Map<String, Schema.SObjectType> sObjectMap = Schema.getGlobalDescribe();
        // * Getting the reference to current sObject
        Schema.SObjectType sObjectTypeInstance = sObjectMap.get(ObjectApiName);
        if(sObjectTypeInstance!=null) {
            // * Getting Fields for current sObject
            Map<String, Schema.SObjectField> fieldMap = sObjectTypeInstance.getDescribe().fields.getMap();
            // * Checking each field one by one, if it's accessible, adding it's name to fieldNames set
            for(Schema.SObjectField field: fieldMap.values()) {
                Schema.DescribeFieldResult fieldResult = field.getDescribe();
                if(fieldResult.isAccessible()) {
                    //fieldNames.add(fieldResult.getName());
                    fieldApiNameWithType.put(String.valueOf(fieldResult.getType()),fieldResult.getName());
                }
            }
        }
        // * Returning the fieldNames set
        //return fieldNames;
        return FieldApiNameWithType;
    }

    public void handleResult(Metadata.DeployResult result, Metadata.DeployCallbackContext context){
        if(result.status == Metadata.DeployStatus.SUCCEEDED){
            System.debug('success'+ result);
        }else{
            System.debug('fail'+result);
        }
    }
    @AuraEnabled(cacheable=false)
    public static Id handleObjectDetails(String fullName, String label, String jsonInput){
        Map<String,String> fieldWithValuesMap = (Map<String,String>)JSON.deserialize(jsonInput, Map<String,String>.class);
        Metadata.CustomMetadata customMetaData = new Metadata.CustomMetadata();
        customMetaData.fullName = fullName;
        customMetaData.label = label;
         for(String key:fieldWithValuesMap.keySet()){
            Metadata.CustomMetadataValue customField = new Metadata.CustomMetadataValue();
            customField.field = key;
            customField.value = (String)fieldWithValuesMap.get(key);
            customMetaData.values.add(customField);
        }
        Metadata.DeployContainer mdContainer = new Metadata.DeployContainer();
        mdContainer.addMetadata(customMetaData);
        Utility callback = new Utility();
        Id jobId = Metadata.Operations.enqueueDeployment(mdContainer, callback);
        return jobId;
    }
    @AuraEnabled(cacheable=true)
    public static List<SObject> DataTableForSObject(String queryExpression){
        String fstr='';
        if(String.isNotEmpty(queryExpression)){
            String str= queryExpression.removeEnd('"');
            fstr=str.removeStart('"');
        }
        Map<String, String> recordtable =new Map<String, String>();
        
        return Database.query(fstr);
    }
    @AuraEnabled(cacheable=true)
    public static Boolean checkForRecord( String objectValue){
        ObjectDetails__mdt objectRecord = [SELECT Id,ObjectName__c FROM ObjectDetails__mdt WHERE ObjectName__c =: objectValue LIMIT 1];
        if(String.isNotBlank(String.valueOf(objectRecord.Id))){
            return true;
        }else{
            return false;
        }
    }
}