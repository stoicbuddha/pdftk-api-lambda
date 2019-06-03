const rootDir = process.cwd(),
			config = require(rootDir + "/config"),
			pdftk = require('node-pdftk'),
			axios = require('axios'),
			fs = require('fs'),
			h = require(rootDir + '/helpers'),
    	aws = require('aws-sdk'),
			s3 = new aws.S3({
			    // Your SECRET ACCESS KEY from AWS should go here,
			    // Never share it!
			    // Setup Env Variable, e.g: process.env.SECRET_ACCESS_KEY
			    secretAccessKey: config.aws.secret_access_key,
			    // Not working key, Your ACCESS KEY ID from AWS should go here,
			    // Never share it!
			    // Setup Env Variable, e.g: process.env.ACCESS_KEY_ID
			    accessKeyId: config.aws.access_key_id,
			    region: config.aws.region // region of your bucket
			}),
			cfsign = require('aws-cloudfront-sign');

			const signingParams = {
			  keypairId: config.aws.cfKey,
			  // Optional - this can be used as an alternative to privateKeyString
			  privateKeyPath: rootDir + '/security/url-signing.pem'
			}

/**
 * Upload file to S3
 * @since 1.0.0
 *
 * @param {object} errorObj - The error object
 * @returns {Promise}
 */
const upload = (fileData, bucket, dir) => {
	return new Promise((resolve, reject) => {
		if (!fileData) return reject("Missing necessary parameters for file upload.");
		const path = fileData.path,
					type = fileData.type,
					name = fileData.name,
					folder = dir ? dir + "/" : "";
	  fs.readFile(path + name, (err, data) => {
	     if (err) return reject(err);
	     const params = {
	         Bucket: bucket || config.aws.assets_bucket,
	         Key: folder + name,
	         Body: data,
	         ContentType: type,
	         ACL: "public-read"
	     };
	     s3.upload(params, function(s3Err, data) {
	         if (s3Err) return reject(s3Err);
	         signingParams.expireTime = Date.now() + 3600; // 1 hour from now
	         const signedUrl = cfsign.getSignedUrl(
						  config.aws.assets_cdn + "/" + name,
						  signingParams
						);
	         h.cleanProcessFolders(name);
	         return resolve({
	         	location: signedUrl,
	         	key: data.key,
	         	type,
	         	name,
	         	folder
	         })
	     });
	  });
	});
};

/**
 * Downloads the initial PDF
 * @since 1.0.0
 *
 * @param {object} errorObj - The error object
 * @returns {object}
 */
const download = async (fileLocation) => {
	const fileName = '_' + (Date.now().toString(36) + Math.random().toString(36).substr(2, 5)).toUpperCase() + ".pdf";
  const path = rootDir + "/pdfs-downloads/" + fileName;
  const writer = fs.createWriteStream(path)

  const response = await axios({
    url: fileLocation,
    method: 'GET',
    responseType: 'stream'
  })

  response.data.pipe(writer)

  return new Promise((resolve, reject) => {
    writer.on('finish', () => {
    	return resolve(fileName);
    })
    writer.on('error', reject);
  })
}

const parseFdfToJson = (fdfString) => {
	const fieldsArray = fdfString.split('/Fields [')[1].split('>>]')[0];
	const lines = fieldsArray.split("\n");
	const fields = [];
	lines.forEach((line, i) => {
		// Make sure we are skipping inputs that aren't text
		if (line.indexOf("/T ") > -1 && lines[i-1].indexOf("/V ()") < 0) return;
		if (line.indexOf("/T ") > -1) {
			const field = line.split("(")[1].split(")")[0];
			fields.push(field);
		}
	});
	return fields.sort();
}

const getFields = (fileLocation) => {
	return new Promise((resolve, reject) => {
		const dl = download(fileLocation);
		dl.then(pdfFile => {
  		const dlPath = rootDir + '/pdfs-downloads/';
  		const ulPath = rootDir + '/pdfs-output/';
			pdftk
		    .input(dlPath + pdfFile)
		    .generateFdf()
		    .output(ulPath + pdfFile + "_fdf.txt")
				.then(buffer => {
					const fdf = parseFdfToJson(buffer.toString('utf8'));
		      return resolve(fdf);
		    })
		    .catch(e => h.perror(e, reject));
		})
		.catch(e => h.perror(e, reject));
	});
}

const fill = (fileLocation, data) => {
	const formattedData = [];
	data.forEach(d => {
		formattedData[d.name] = d.data;
	})
	return new Promise((resolve, reject) => {
		const dl = download(fileLocation);
		dl.then(pdfFile => {
  		const dlPath = rootDir + '/pdfs-downloads/';
  		const ulPath = rootDir + '/pdfs-output/';
			pdftk
		    .input(dlPath + pdfFile)
		    .fillForm(formattedData)
		    .flatten()
		    .output(ulPath + pdfFile)
		    .then(buffer => {
		      upload({
		      	path: ulPath,
		      	type: "application/pdf",
		      	name: pdfFile
		      }, null, config.aws.dir)
		      	.then(uploaded => {
		      		return resolve(uploaded);
		      	})
		      	.catch(e => h.perror(e, reject));
		    })
		    .catch(e => h.perror(e, reject));
			})
			.catch(e => h.perror(e, reject));
	});
}

module.exports = {
	fill,
	getFields
}