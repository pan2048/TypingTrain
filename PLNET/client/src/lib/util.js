class Util {
	static async getJSON(file) {
	  let that;
	  await $.getJSON(file, function(data) {
	    that = data;
	  })
	  .fail(function() {
	    console.log( "getJSON error! file:" + file);
	  })
	  return that;
	}
}

export { Util };

if (false) {
	Util.getJSON("/code/client/config/config.json").then(data => { 
		console.log(data);
  });
}
