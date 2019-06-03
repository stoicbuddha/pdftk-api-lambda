const pdftk = require("../controllers/pdftk"),
			h = require("../helpers");

module.exports = (server) => {

	/*** GET METHODS ***/

	// Fill a form and return the link to the filled form
	server.get('/fields', (req, res) => {
		const {params} = req;
		if (!params.file) {
			return res.send(400, h.failureFormat({message: "Missing parameters", params_received: params}));
		}
		pdftk.getFields(params.file)
			.then(fields => {
				return res.send(200, h.successFormat({fields}));
			})
			.catch(err => {
				console.log({err})
				return res.send(500, h.failureFormat({message: err}));
			})
	});

	/*** POST METHODS ***/

	// Fill a form and return the link to the filled form
	server.post('/fill', (req, res) => {
		const {params} = req;
		if (!params.file || !params.fields || params.fields.length < 1) {
			return res.send(400, h.failureFormat({message: "Missing parameters", params_received: params}));
		}
		pdftk.fill(params.file, params.fields)
			.then(pdfFile => {
				return res.send(200, h.successFormat({path: pdfFile}));
			})
			.catch(err => {
				console.log({err})
				return res.send(500, h.failureFormat({message: err}));
			})
	});
}