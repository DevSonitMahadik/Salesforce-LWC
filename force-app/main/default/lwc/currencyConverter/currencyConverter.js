import { LightningElement, track } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import getCurrencyRateInfo from '@salesforce/apex/CurrencyCoversion.getCurrencyRateInfo';

const CURRENCY_CODES = [
    'USD','AED','AFN','ALL','AMD','ANG','AOA','ARS','AUD','AWG','AZN','BAM','BBD','BDT','BGN',
    'BHD','BIF','BMD','BND','BOB','BRL','BSD','BTN','BWP','BYN','BZD','CAD','CDF','CHF','CLP',
    'CNY','COP','CRC','CUP','CVE','CZK','DJF','DKK','DOP','DZD','EGP','ERN','ETB','EUR','FJD',
    'FKP','FOK','GBP','GEL','GGP','GHS','GIP','GMD','GNF','GTQ','GYD','HKD','HNL','HTG','HUF',
    'IDR','ILS','IMP','INR','IQD','IRR','ISK','JEP','JMD','JOD','JPY','KES','KGS','KHR','KID',
    'KMF','KRW','KWD','KYD','KZT','LAK','LBP','LKR','LRD','LSL','LYD','MAD','MDL','MGA','MKD',
    'MMK','MNT','MOP','MRU','MUR','MVR','MWK','MXN','MYR','MZN','NAD','NGN','NIO','NOK','NPR',
    'NZD','OMR','PAB','PEN','PGK','PHP','PKR','PLN','PYG','QAR','RON','RSD','RUB','RWF','SAR',
    'SBD','SCR','SDG','SEK','SGD','SHP','SLE','SLL','SOS','SRD','SSP','STN','SYP','SZL','THB',
    'TJS','TMT','TND','TOP','TRY','TTD','TVD','TWD','TZS','UAH','UGX','UYU','UZS','VES','VND',
    'VUV','WST','XAF','XCD','XDR','XOF','XPF','YER','ZAR','ZMW','ZWL'
];

export default class CurrencyConverter extends LightningElement {
    @track fromCurrency = 'USD';
    @track toCurrency = 'EUR';
    @track fromAmount = '';
    @track toAmount = '';
    @track isLoading = false;
    @track conversionResult = '';
    @track rateLabel = '';
    @track lastUpdated = '';
    @track hasError = false;
    @track errorMessage = '';

    get currencyOptions() {
        return CURRENCY_CODES.map(code => ({ label: code, value: code }));
    }

    handleFromCurrencyChange(event) {
        this.fromCurrency = event.detail.value;
        this.clearResult();
    }

    handleToCurrencyChange(event) {
        this.toCurrency = event.detail.value;
        this.clearResult();
    }

    handleFromAmountChange(event) {
        this.fromAmount = event.detail.value;
        this.clearResult();
    }

    handleSwap() {
        const tempCurrency = this.fromCurrency;
        this.fromCurrency = this.toCurrency;
        this.toCurrency = tempCurrency;
        const tempAmount = this.fromAmount;
        this.fromAmount = this.toAmount;
        this.toAmount = tempAmount;
        this.clearResult();
    }

    handleConvert() {
        this.hasError = false;
        this.errorMessage = '';

        if (!this.fromAmount || isNaN(Number(this.fromAmount)) || Number(this.fromAmount) < 0) {
            this.dispatchEvent(new ShowToastEvent({
                title: 'Missing Amount',
                message: 'Please enter a valid amount to convert.',
                variant: 'warning'
            }));
            return;
        }

        if (this.fromCurrency === this.toCurrency) {
            this.toAmount = this.fromAmount;
            this.conversionResult = `${this.fromAmount} ${this.fromCurrency} = ${this.fromAmount} ${this.toCurrency}`;
            this.rateLabel = `1 ${this.fromCurrency} = 1.0000 ${this.toCurrency}`;
            return;
        }

        this.isLoading = true;
        this.conversionResult = '';
        this.toAmount = '';

        getCurrencyRateInfo({
            currencyCode1: this.fromCurrency,
            currencyCode2: this.toCurrency
        })
        .then(info => {
            this.isLoading = false;
            const rate = info.rate;
            const converted = (rate * Number(this.fromAmount)).toFixed(4);
            this.toAmount = converted;
            this.conversionResult = `${Number(this.fromAmount).toLocaleString()} ${this.fromCurrency} = ${Number(converted).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })} ${this.toCurrency}`;
            this.rateLabel = `1 ${this.fromCurrency} = ${Number(rate).toFixed(6)} ${this.toCurrency}`;
            this.lastUpdated = info.timeLastUpdate
                ? new Date(info.timeLastUpdate).toLocaleString()
                : '';
        })
        .catch(error => {
            this.isLoading = false;
            this.hasError = true;
            this.errorMessage = (error.body && error.body.message)
                ? error.body.message
                : 'Unable to fetch the exchange rate. Please try again.';
        });
    }

    clearResult() {
        this.conversionResult = '';
        this.rateLabel = '';
        this.lastUpdated = '';
        this.toAmount = '';
        this.hasError = false;
        this.errorMessage = '';
    }
}
