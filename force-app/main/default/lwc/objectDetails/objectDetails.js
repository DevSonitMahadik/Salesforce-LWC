import { LightningElement, wire, track } from 'lwc';
import getObjectList from "@salesforce/apex/Utility.getObjectList";
import getObjectFields from "@salesforce/apex/Utility.getObjectFields";
import handleObjectDetails from "@salesforce/apex/Utility.handleObjectDetails";
import getDataformUtility from "@salesforce/apex/Utility.DataTableForSObject";
import checkForRecord from "@salesforce/apex/Utility.checkForRecord";
export default class ObjectDetails extends LightningElement {
    @track columns = [];
    text = 'Select Object';
    dataTableTemplate = false;
    @track objectmapData = [];
    lstChannelSector = [];
    picklistoption = [];
    @track objects = [];
    fieldtype;
    fireErrorForSyntax = false;
    fireErrorForApiName = false;
    @wire(getObjectList) wiredResult({ data, error }) {
        if (data) {
            //mapData = [];
            var conts = data;
            for (var key in conts) {
                this.objectmapData.push({ value: conts[key], key: key }); //Here we are creating the array to show on UI.
                this.objects = Object.entries(data).map(([label, value]) => ({ label, value }))// Here we are displaying array in combobox.
            }
            console.log(this.objectmapData);
            console.log(this.objects);
        }
        if (error) {
            console.error(error);
        }
    }
    get objects() {
        return this.objects;
    }
    objectvalue;
    objectFieldList = [];
    fieldForSearch = false;

    handleChange(event) {
        this.arrayToHoldSelectedFields = [];
        this.criteria = '';
        this.objectFieldList = [];
        this.objectvalue = event.detail.value;
        this.fieldForSearch = true;
        this.getObjectFieldsByApiName(this.objectvalue);
        // value=this.objectvalue;
    }

    getObjectFieldsByApiName(objectName) {
        getObjectFields({
            ObjectApiName: objectName
        })
            .then((result) => {
                //let data=result;
                // console.log(data);
                this.objectFieldList = Object.entries(result).map(([label, value]) => ({ label, value }));
                // console.log(this.objectFieldList);
            })
            .catch((error) => {
                console.error(error);
            });
    }
    //-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------  
    // Below code is for checkbox check and uncheck  
    ischeck = false;
    value;
    criteria;
    arrayToHoldSelectedFields = [];
    count = 0;
    checkboxflip(event) {
        this.count++;
        this.ischeck = event.target.checked;
        this.value = event.target.label;
        this.fieldtype = event.target.dataset.fieldtype;
        if (this.ischeck) {
            this.arrayToHoldSelectedFields.push(this.value);
            this.columns.push({ label: this.value, fieldName: this.value });
        } else if (!this.ischeck && (this.arrayToHoldSelectedFields.includes(this.value))) {
            for (var i = 0; i < this.arrayToHoldSelectedFields.length; i++) {
                if (this.arrayToHoldSelectedFields[i] == this.value) {
                    this.arrayToHoldSelectedFields.splice(i, 1);
                }
            }
        }
        if (this.arrayToHoldSelectedFields.length == 0) {
            this.criteria = this.arrayToHoldSelectedFields.join(" AND ");
        } else {
            this.criteria = "SELECT " + this.arrayToHoldSelectedFields.join(" , ") + " FROM " + this.objectvalue;
        }
    }
    //-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------  
    // Below code is for Validate Criteria  
    enteredCriteria;
    handleClick() {
        this.enteredCriteria = this.template.querySelector('lightning-textarea').value;
        let enteredCriteriaElements = this.enteredCriteria.split(' ');
        let predefineElements = new Set(["SELECT", ",", "FROM", this.objectvalue, "(", ")"]);

        for (let i = 0; i < enteredCriteriaElements.length; i++) {
            if (!this.arrayToHoldSelectedFields.includes(enteredCriteriaElements[i])) {
                if (!predefineElements.has(enteredCriteriaElements[i])) {
                    this.fireErrorForSyntax = true;
                    return true;
                }
                else {
                    return false;
                }
            }
            if (predefineElements.has(enteredCriteriaElements[i]) && (enteredCriteriaElements[i + 1] == ',')) {
                this.fireErrorForSyntax = true;
                return true;
            }
            if ((enteredCriteriaElements[i] == ',') && predefineElements.has(enteredCriteriaElements[i + 1])) {
                this.fireErrorForSyntax = true;
                return true;
            }
        }

    }
    //-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------  
    // Below code is for saving record in Metadata
    spinneron = false;
    ObjectDetails = {};
    fullObjectDetails = '';
    saveMetadataRecord() {
        this.ObjectDetails = {
            'FieldsForSearch__c': JSON.stringify(this.arrayToHoldSelectedFields),
            'ObjectName__c': JSON.stringify(this.objectvalue),
            'QueryExpresion__c': JSON.stringify(this.enteredCriteria)
        };
        checkForRecord({ objectValue: this.objectvalue })
            .then(result => {
                let check = result;
                if (JSON.stringify(check)) {
                    this.fullObjectDetails = JSON.stringify(this.ObjectDetails);
                    console.log("true: " + this.fullObjectDetails);
                } else {
                    this.fullObjectDetails = JSON.stringify(this.ObjectDetails + new Date().getTime());
                    console.log("false :" + this.fullObjectDetails);
                }
            }).catch((error) => {
                console.error(error);
            });
        this.spinneron = true;
        /// This is for saving data in Custom Metadata
        handleObjectDetails({
            fullName: this.fullObjectDetails,
            label: this.objectvalue,
            jsonInput: JSON.stringify(ObjectDetails)
        })
            .then(result => {
                window.console.log('result ===> ' + result);
                this.spinneron = false;
            })
            .catch((error) => {
                this.spinneron = false;
                console.error(error);
            });
    }
    //-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------  
    // Below code is for onchange criteria handler
    ChangeincriteriaHandler(event) {
        alert(event.target.value);
        this.columns = [];
        this.dataset = [];
    }
    //-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------  
    // Below code is for getting data from server
    dataset = [];
    checkCriteria = false;
    getDatafromServer() {
        this.checkCriteria = this.handleClick();
        if (!this.checkCriteria) {
            this.dataTableTemplate = true;
            this.enteredCriteria = this.template.querySelector('lightning-textarea').value;
            getDataformUtility({
                queryExpression: JSON.stringify(this.enteredCriteria)
            })
                .then(result => {
                    this.dataset = result;
                    this.columns.push({ label: this.value, fieldName: this.value });
                    this.spinneron = false;
                })
                .catch((error) => {
                    this.spinneron = false;
                });
        }
    }
}