import http from 'k6/http';

export default function() {
      const url =
    'http://poc-knative-node-starwars.default.20.10.226.5.sslip.io/api/v1/starwar/characters?q=darth&p=1';

  const resp = http.get(url);
  console.log(resp.status);

}