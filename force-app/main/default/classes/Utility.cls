public class Utility implements Metadata.DeployCallback {

    @AuraEnabled(cacheable=true)
    public static Map<String, String> getObjectList() {
        Map<String, String> objectTable = new Map<String, String>();
        List<EntityDefinition> objLabels = [
            SELECT Label, QualifiedApiName
            FROM EntityDefinition
            WHERE IsRetrieveable = TRUE
              AND IsTriggerable = TRUE
              AND IsQueryable = TRUE
              AND IsEverUpdatable = TRUE
              AND IsSearchable = TRUE
              AND IsEverCreatable = TRUE
              AND IsCustomSetting = FALSE
              AND IsApexTriggerable = TRUE
            ORDER BY Label ASC
            LIMIT 49999
        ];
        for (EntityDefinition ed : objLabels) {
            objectTable.put(ed.Label, ed.QualifiedApiName);
        }
        return objectTable;
    }

    @AuraEnabled(cacheable=true)
    public static Map<String, String> getObjectFields(String objectApiName) {
        Map<String, String> fieldApiNameWithType = new Map<String, String>();
        Map<String, Schema.SObjectType> sObjectMap = Schema.getGlobalDescribe();
        Schema.SObjectType sObjectTypeInstance = sObjectMap.get(objectApiName);
        if (sObjectTypeInstance != null) {
            Map<String, Schema.SObjectField> fieldMap = sObjectTypeInstance.getDescribe().fields.getMap();
            for (Schema.SObjectField field : fieldMap.values()) {
                Schema.DescribeFieldResult fieldResult = field.getDescribe();
                if (fieldResult.isAccessible()) {
                    fieldApiNameWithType.put(fieldResult.getName(), String.valueOf(fieldResult.getType()));
                }
            }
        }
        return fieldApiNameWithType;
    }

    @AuraEnabled(cacheable=true)
    public static Integer getRecordCount(String objectApiName) {
        if (String.isBlank(objectApiName)) {
            return 0;
        }
        String query = 'SELECT COUNT() FROM ' + String.escapeSingleQuotes(objectApiName);
        return Database.countQuery(query);
    }

    public void handleResult(Metadata.DeployResult result, Metadata.DeployCallbackContext context) {
        if (result.status == Metadata.DeployStatus.SUCCEEDED) {
            System.debug('Metadata deploy succeeded: ' + result);
        } else {
            System.debug('Metadata deploy failed: ' + result);
        }
    }

    @AuraEnabled(cacheable=false)
    public static Id handleObjectDetails(String fullName, String label, String jsonInput) {
        Map<String, String> fieldWithValuesMap = (Map<String, String>) JSON.deserialize(jsonInput, Map<String, String>.class);
        Metadata.CustomMetadata customMetaData = new Metadata.CustomMetadata();
        customMetaData.fullName = fullName;
        customMetaData.label = label;
        for (String key : fieldWithValuesMap.keySet()) {
            Metadata.CustomMetadataValue customField = new Metadata.CustomMetadataValue();
            customField.field = key;
            customField.value = fieldWithValuesMap.get(key);
            customMetaData.values.add(customField);
        }
        Metadata.DeployContainer mdContainer = new Metadata.DeployContainer();
        mdContainer.addMetadata(customMetaData);
        Utility callback = new Utility();
        return Metadata.Operations.enqueueDeployment(mdContainer, callback);
    }

    @AuraEnabled(cacheable=true)
    public static List<SObject> DataTableForSObject(String queryExpression) {
        if (String.isBlank(queryExpression)) {
            return new List<SObject>();
        }
        String cleanQuery = queryExpression.removeStart('"').removeEnd('"').trim();
        return Database.query(cleanQuery);
    }

    @AuraEnabled(cacheable=true)
    public static Boolean checkForRecord(String objectValue) {
        try {
            List<ObjectDetails__mdt> records = [
                SELECT Id, ObjectName__c
                FROM ObjectDetails__mdt
                WHERE ObjectName__c = :objectValue
                LIMIT 1
            ];
            return !records.isEmpty();
        } catch (Exception e) {
            System.debug('checkForRecord error: ' + e.getMessage());
            return false;
        }
    }
}
