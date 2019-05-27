const pdftk = require("../controllers/pdftk"),
			h = require("../helpers");

module.exports = (server) => {

	/*** POST METHODS ***/

	// Save an answer
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