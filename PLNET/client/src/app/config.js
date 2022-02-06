import {Util} from '../lib/util.js';

class Config {
  constructor(callback) {
    let file = "/code/client/config/config.json";
    Util.getJSON(file).then(data => { 
      callback(data);
    });
  }
}	

export { Config };

if (false) {
  let func = function(data) {
    console.log(data);
  }
  let config = new Config(func);
}
