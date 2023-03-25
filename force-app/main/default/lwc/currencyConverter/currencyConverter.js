import { LightningElement, track, wire } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import getCurrencyCodeCoversion from '@salesforce/apex/CurrencyCoversion.getCurrencyCodeCoversion';
export default class CurrencyConverter extends LightningElement {
    currencyCode = ["USD","AED","AFN","ALL","AMD","ANG","AOA","ARS","AUD","AWG","AZN","BAM","BBD","BDT","BGN","BHD","BIF","BMD","BND","BOB","BRL","BSD","BTN","BWP",
                    "BYN","BZD","CAD","CDF","CHF","CLP","CNY","COP","CRC","CUP","CVE","CZK","DJF","DKK","DOP","DZD","EGP","ERN","ETB","EUR","FJD","FKP","FOK","GBP",
                    "GEL","GGP","GHS","GIP","GMD","GNF","GTQ","GYD","HKD","HNL","HRK","HTG","HUF","IDR","ILS","IMP","INR","IQD","IRR","ISK", "JEP","JMD","JOD","JPY",
                    "KES","KGS","KHR","KID","KMF","KRW","KWD","KYD","KZT","LAK","LBP","LKR","LRD","LSL","LYD","MAD","MDL","MGA","MKD","MMK","MNT","MOP","MRU","MUR",
                    "MVR","MWK","MXN","MYR","MZN","NAD","NGN","NIO","NOK","NPR","NZD","OMR","PAB","PEN","PGK","PHP","PKR","PLN","PYG","QAR","RON","RSD","RUB","RWF",
                    "SAR","SBD","SCR","SDG","SEK","SGD","SHP","SLE","SLL","SOS","SRD","SSP","STN","SYP","SZL","THB","TJS","TMT", "TND","TOP","TRY","TTD","TVD","TWD",
                    "TZS","UAH","UGX","UYU","UZS","VES","VND","VUV","WST","XAF","XCD","XDR","XOF","XPF","YER","ZAR","ZMW","ZWL"];
   selectOption1;
   selectOption2;
   textBox1;
   textBox2;
   value2;
   value1;
   getdata(x,y,t1,t2){
        if(x==null || x==undefined || x==''){
            x='USD';
        }
        if(y==null || y==undefined || y==''){
            y='USD';
        }
        getCurrencyCodeCoversion({currencyCode1:x,currencyCode2:y})
            .then((result) => {
                if(t1==undefined){
                    this.value1 = result*Number(t2);
                }
                if(t2 ==undefined){
                    this.value2 = result*Number(t1);
                }
            })
            .catch((error) => {
                console.log(error);
                const event = new ShowToastEvent({
                    title: 'Error',
                    message: error.getBody(),
                });
                this.dispatchEvent(event);
            });
   }
    checkforslectionoption1(event){
        this.selectOption1=event.target.value;
    }
    checkforslectionoption2(event){
        this.selectOption2=event.target.value;
    }
    getValuefromTextBox1(event){
        this.textBox1=event.target.value;
        this.getdata(this.selectOption1,this.selectOption2,this.textBox1,null);
    }
    getValuefromTextBox2(event){
        this.textBox2=event.target.value;
        this.getdata(this.selectOption2,this.selectOption1,null,this.textBox2);
    }

}