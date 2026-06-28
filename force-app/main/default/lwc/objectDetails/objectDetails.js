import { LightningElement, wire, track } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import getObjectList from '@salesforce/apex/Utility.getObjectList';
import getObjectFields from '@salesforce/apex/Utility.getObjectFields';
import handleObjectDetails from '@salesforce/apex/Utility.handleObjectDetails';
import getDataformUtility from '@salesforce/apex/Utility.DataTableForSObject';
import checkForRecord from '@salesforce/apex/Utility.checkForRecord';
import getRecordCount from '@salesforce/apex/Utility.getRecordCount';

export default class ObjectDetails extends LightningElement {
    @track objects = [];
    @track objectFieldList = [];
    @track selectedFields = [];
    @track columns = [];
    @track dataset = [];
    @track filteredFieldList = [];

    objectvalue = '';
    criteria = '';
    whereClause = '';
    orderByClause = 'Name ASC';
    queryLimit = 200;
    fieldSearchTerm = '';

    fieldForSearch = false;
    dataTableTemplate = false;
    spinneron = false;
    fireErrorForSyntax = false;
    saveSuccess = false;
    recordCount = 0;

    @wire(getObjectList)
    wiredResult({ data, error }) {
        if (data) {
            this.objects = Object.entries(data)
                .map(([label, value]) => ({ label, value }))
                .sort((a, b) => a.label.localeCompare(b.label));
        }
        if (error) {
            console.error('Error loading object list:', error);
            this.showToast('Error', 'Failed to load object list.', 'error');
        }
    }

    get hasSelectedFields() {
        return this.selectedFields.length > 0;
    }

    get isRunQueryDisabled() {
        return this.spinneron || this.selectedFields.length === 0;
    }

    get isSaveDisabled() {
        return this.spinneron || this.selectedFields.length === 0;
    }

    get recordCountLabel() {
        return `~${this.recordCount.toLocaleString()} records`;
    }

    get resultCountLabel() {
        return `${this.dataset.length} row${this.dataset.length !== 1 ? 's' : ''}`;
    }

    handleChange(event) {
        this.objectvalue = event.detail.value;
        this.resetFieldState();
        this.fieldForSearch = true;
        this.loadObjectFields(this.objectvalue);
        this.loadRecordCount(this.objectvalue);
    }

    loadObjectFields(objectName) {
        getObjectFields({ ObjectApiName: objectName })
            .then(result => {
                this.objectFieldList = Object.entries(result)
                    .map(([name, type]) => ({ name, type, checked: false }))
                    .sort((a, b) => a.name.localeCompare(b.name));
                this.filteredFieldList = [...this.objectFieldList];
            })
            .catch(error => {
                console.error('Error loading fields:', error);
                this.showToast('Error', 'Failed to load fields for the selected object.', 'error');
            });
    }

    loadRecordCount(objectName) {
        getRecordCount({ objectApiName: objectName })
            .then(count => {
                this.recordCount = count;
            })
            .catch(() => {
                this.recordCount = 0;
            });
    }

    handleFieldSearch(event) {
        this.fieldSearchTerm = event.detail.value.toLowerCase();
        this.filteredFieldList = this.objectFieldList.filter(f =>
            f.name.toLowerCase().includes(this.fieldSearchTerm) ||
            f.type.toLowerCase().includes(this.fieldSearchTerm)
        );
    }

    handleCheckboxChange(event) {
        const fieldName = event.target.dataset.fieldname;
        const isChecked = event.target.checked;

        this.objectFieldList = this.objectFieldList.map(f =>
            f.name === fieldName ? { ...f, checked: isChecked } : f
        );
        this.filteredFieldList = this.filteredFieldList.map(f =>
            f.name === fieldName ? { ...f, checked: isChecked } : f
        );

        if (isChecked) {
            if (!this.selectedFields.includes(fieldName)) {
                this.selectedFields = [...this.selectedFields, fieldName];
                this.columns = [...this.columns, { label: fieldName, fieldName: fieldName }];
            }
        } else {
            this.selectedFields = this.selectedFields.filter(f => f !== fieldName);
            this.columns = this.columns.filter(c => c.fieldName !== fieldName);
        }

        this.buildQuery();
    }

    handleWhereChange(event) {
        this.whereClause = event.detail.value;
        this.buildQuery();
    }

    handleOrderByChange(event) {
        this.orderByClause = event.detail.value;
        this.buildQuery();
    }

    handleLimitChange(event) {
        this.queryLimit = event.detail.value;
        this.buildQuery();
    }

    handleCriteriaChange(event) {
        this.criteria = event.detail.value;
        this.fireErrorForSyntax = false;
    }

    handleCopyQuery() {
        if (!this.criteria) {
            this.showToast('Nothing to copy', 'Build a query first.', 'warning');
            return;
        }
        navigator.clipboard.writeText(this.criteria)
            .then(() => this.showToast('Copied!', 'SOQL query copied to clipboard.', 'success'))
            .catch(() => this.showToast('Copy failed', 'Could not copy to clipboard.', 'error'));
    }

    handleClear() {
        this.resetFieldState();
        this.fieldForSearch = false;
        this.objectvalue = '';
    }

    buildQuery() {
        if (this.selectedFields.length === 0) {
            this.criteria = '';
            return;
        }
        let query = 'SELECT ' + this.selectedFields.join(', ') + ' FROM ' + this.objectvalue;
        if (this.whereClause && this.whereClause.trim()) {
            query += ' WHERE ' + this.whereClause.trim();
        }
        if (this.orderByClause && this.orderByClause.trim()) {
            query += ' ORDER BY ' + this.orderByClause.trim();
        }
        if (this.queryLimit) {
            query += ' LIMIT ' + this.queryLimit;
        }
        this.criteria = query;
        this.fireErrorForSyntax = false;
    }

    getDatafromServer() {
        if (!this.criteria || !this.criteria.trim()) {
            this.showToast('No Query', 'Please select at least one field to build a query.', 'warning');
            return;
        }
        this.fireErrorForSyntax = false;
        this.spinneron = true;
        this.dataTableTemplate = false;

        getDataformUtility({ queryExpression: this.criteria })
            .then(result => {
                this.dataset = result;
                this.dataTableTemplate = true;
                this.spinneron = false;
            })
            .catch(error => {
                this.spinneron = false;
                this.fireErrorForSyntax = true;
                console.error('Query error:', error);
                this.showToast(
                    'Query Failed',
                    (error.body && error.body.message) ? error.body.message : 'The query returned an error.',
                    'error'
                );
            });
    }

    saveMetadataRecord() {
        if (!this.criteria) {
            this.showToast('Nothing to Save', 'Build a query before saving.', 'warning');
            return;
        }
        this.spinneron = true;
        this.saveSuccess = false;

        const metadataRecord = {
            'FieldsForSearch__c': JSON.stringify(this.selectedFields),
            'ObjectName__c': this.objectvalue,
            'QueryExpresion__c': this.criteria
        };

        checkForRecord({ objectValue: this.objectvalue })
            .then(exists => {
                const fullName = exists
                    ? 'ObjectDetails.' + this.objectvalue
                    : 'ObjectDetails.' + this.objectvalue + '_' + new Date().getTime();

                return handleObjectDetails({
                    fullName: fullName,
                    label: this.objectvalue,
                    jsonInput: JSON.stringify(metadataRecord)
                });
            })
            .then(() => {
                this.spinneron = false;
                this.saveSuccess = true;
                this.showToast('Saved', 'Query configuration saved successfully.', 'success');
                setTimeout(() => { this.saveSuccess = false; }, 5000);
            })
            .catch(error => {
                this.spinneron = false;
                console.error('Save error:', error);
                this.showToast(
                    'Save Failed',
                    (error.body && error.body.message) ? error.body.message : 'Failed to save the query configuration.',
                    'error'
                );
            });
    }

    resetFieldState() {
        this.objectFieldList = [];
        this.filteredFieldList = [];
        this.selectedFields = [];
        this.columns = [];
        this.dataset = [];
        this.criteria = '';
        this.whereClause = '';
        this.orderByClause = 'Name ASC';
        this.queryLimit = 200;
        this.fieldSearchTerm = '';
        this.dataTableTemplate = false;
        this.fireErrorForSyntax = false;
        this.saveSuccess = false;
        this.spinneron = false;
        this.recordCount = 0;
    }

    showToast(title, message, variant) {
        this.dispatchEvent(new ShowToastEvent({ title, message, variant }));
    }
}
