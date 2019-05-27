const successFormat = (data) => {
	return {
		success: true,
		data
	}
}

const failureFormat = (error) => {
	return {
		success: false,
		error
	}
}

/**
 * Shortens the writing of promise error rejections
 * @since 1.0.0
 *
 * @param {string} e - The error message
 * @param {function} r - The rejection functionality
 * @returns {Promise.reject}
 */
const perror = (e, r) => {
	return r(e);
}

const cleanProcessFolders = (name) => {
	const fs = require('fs'),
				rootDir = process.cwd();
	fs.unlinkSync(rootDir + '/pdfs-downloads/' + name);
	fs.unlinkSync(rootDir + '/pdfs-output/' + name);
}

module.exports = {
	successFormat,
	failureFormat,
	perror,
	cleanProcessFolders
}