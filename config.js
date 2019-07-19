const config = {
	"dev": {
		"port": 3000,
		"jwt": {
			"secret": "ONHM@m88dgJdmzIM8s8l8aq7WkUHGVcdA$TreYT06@30Y1Odpc"
		},
		"tests": {
			port: 3501
		},
		"aws": {
			secret_access_key: "YE59zSCAc6y/3ftoe22Eddvx/kq+XIPnZw6egWa2",
			access_key_id: "AKIAV5MNXDIOIYL4AM7V",
			region: "us-east-1",
			assets_cdn: "https://dt83twmevt8cq.cloudfront.net",
			assets_bucket: "stoic-dev",
			dir: "pdftk-tests",
			cfKey: "APKAJLCRE24XMNTV3GZA"
		}
	}
}
module.exports = config[process.env.NODE_ENV];