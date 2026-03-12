![Logo](https://platform.simplicite.io/logos/standard/logo250.png)
* * *

# Creation process

## I. Git setup

1. create empty git repo `module-dsfr-app`
2. link it to Simplicité module
```json
{
	"origin": {
		"uri": "https://github.com/Abel-HenryLapassat/module-dsfr-app.git"
	},
	"type": "git"
}
```
3. push from Simplicité

## II. DSFR setup

1. create folder `dsfr-app`
```shell
npm create vite@latest dsfr-app -- --template vanilla
cd dsfr-app
```
2. install libs (DSFR & Simplicité)
```shell
npm install @gouvfr/dsfr
npm install simplicite
```

## III. Project setup

1. Cleanup vite's default content
2. 