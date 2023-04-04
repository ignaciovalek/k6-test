import exec from "k6/execution";
//import fetch from "k6";
import http, { get } from "k6/http";
import { check, sleep, group } from 'k6';
import { SharedArray } from 'k6/data';
import { htmlReport } from "https://raw.githubusercontent.com/benc-uk/k6-reporter/main/dist/bundle.js";
import { textSummary } from "https://jslib.k6.io/k6-summary/0.0.1/index.js";
import crypto from "k6/crypto";
//import { describe, expect } from 'https://jslib.k6.io/k6chaijs/4.3.4.1/index.js';
export const options = {
  discardResponseBodies: false,
  scenarios: {
    contacts: {
      executor: 'constant-arrival-rate',
      rate: 10, // 200 RPS, since timeUnit is the default 1s
      duration: '10s',
      preAllocatedVUs: 30,
      maxVUs: 60,
    },
  },
  thresholds: {
    // 90% of requests must finish within 400ms, 95% within 800, and 99.9% within 2s.
    http_req_duration: ['p(90) < 800', 'p(95) < 1000', 'p(99.9) < 2000'],
  },
};
export function setup() {
  let token = getToken();
  return token;
}
const data = new SharedArray('customers data', function () {
  const customers = JSON.parse(open('test-case-cuenta-corriente-detalle-obtener-integrada.json')); 
  return customers;
});
export default function (accessToken) {
  const customer = data[Math.floor(Math.random() * data.length)];
  group(`CL-API CuentaCorrienteDetalleObtener - Autoescalado QA X-Checking-Account-Id: ${customer.c_checking_account_id}`, function () {
    let c_date_iso = getDate();
    console.log(`${customer.c_checking_account_id}`);
    let customer_iteration = `${customer.c_checking_account_id}`;
    let account_id = customer_iteration;

    const c_secretUser = getSecretUser(account_id, accessToken)
    //console.log(c_secretUser);
    let params = {
      headers: {
        "X-Country": "CL",
        "X-Commerce": "BANCO",
        "X-Channel": "Web",
        "Authorization": `Bearer ${accessToken}`,
        "X-Checking-Account-Id": `${account_id}`,
        "X-Product-Type": "1",
        "X-Product-SubType": "1-201",
        "X-Operator": "123",
        "X-Trace-Id": "pruebaAutoescaladoQA",
        "X-Forwarded-For": "10.154.155.218",
        "Content-Type": "application/json"
      },
    };
    let body = {
    }
    //let res = http.request("GET", `${url}/${c_secretUser}/devices`, body, params);
    let res = http.request("GET", `https://integracion-bfcl-qa.fif.tech/checking-account/v1/checking-accounts/${c_secretUser}`, JSON.stringify(body), params)
    //`https://integracion-bfcl-qa.fif.tech/checking-account/v1/checking-accounts/${c_secretCheckingAccount_id}`
    
    

    console.log(`https://integracion-bfcl-qa.fif.tech/checking-account/v1/checking-accounts/${c_secretUser}`);
    let checkRes = check(res, {
      "CL Api CuentaCorrienteDetalleObtener - Http Status Code is 200": (r) => r.status == 200,
    });
  });
  // Short break between iterations
  sleep(1);
};
export function handleSummary(data) {
  return {
    "reportApiCuentaCorrienteDetalleObtenerAutoescalado24022023VU60P02.html": htmlReport(data), //cambiar nombre de archivo htnl de acuerdo al día o número de ejecución
    stdout: textSummary(data, { indent: " ", enableColors: true }),
  }
}
function encodePathParam256(valor) {
  return crypto.sha256(valor, "hex")
}
function getSecretUser(account_id, token) {
  const rawStr_secretUser = account_id + token;
  const sha256 = encodePathParam256(rawStr_secretUser);
  console.log(sha256);
  return sha256;
}
function getDate() {
  var date = new Date();
  var date_iso = new Date(date.getTime() - (date.getTimezoneOffset() * 60000)).toISOString().slice(0, 19) + 'Z';
  console.log("fecha: ", date_iso);
  return (date_iso)
}
function getToken() {
  const url = 'https://integracion-bfcl-qa.fif.tech/oauth/cc/token';
  const payload = {
    grant_type: 'client_credentials',
  };
  const params = {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'X-Api-Key': '', //INGRESAR KEY
      'Authorization': 'Basic ' //INGRESAR AUTHORIZATION BASE64
    },
  };
  const response =  http.post(url, payload, params);
  const access_token =  response.json().access_token;
  return access_token;
}
