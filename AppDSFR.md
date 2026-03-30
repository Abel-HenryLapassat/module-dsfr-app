<!--
 ___ _            _ _    _ _    __
/ __(_)_ __  _ __| (_)__(_) |_ /_/
\__ \ | '  \| '_ \ | / _| |  _/ -_)
|___/_|_|_|_| .__/_|_\__|_|\__\___|
            |_| 
-->
![Logo](https://platform.simplicite.io/logos/standard/logo250.png)
* * *

`AppDSFR` module definition
===========================

`DsfrEmploye` business object definition
----------------------------------------



### Fields

| Name                                                         | Type                                     | Required | Updatable | Personal | Description                                                                      |
|--------------------------------------------------------------|------------------------------------------|----------|-----------|----------|----------------------------------------------------------------------------------|
| `dsfrEmpId`                                                  | int(11)                                  | yes*     | yes       |          | -                                                                                |
| `dsfrEmpNom`                                                 | char(100)                                |          | yes       |          | -                                                                                |
| `dsfrEmpPrenom`                                              | char(100)                                |          | yes       |          | -                                                                                |
| `dsfrEmpTel`                                                 | phone(100)                               |          | yes       |          | -                                                                                |
| `dsfrEmpMail`                                                | email(100)                               | yes      | yes       |          | -                                                                                |
| `dsfrEmpSocId` link to **`DsfrSociete`**                     | id                                       | yes      | yes       |          | -                                                                                |
| _Ref. `dsfrEmpSocId.dsfrSocNom`_                             | _char(100)_                              |          |           |          | -                                                                                |
| _Ref. `dsfrEmpSocId.dsfrSocLogo`_                            | _image_                                  |          |           |          | -                                                                                |

`DsfrSociete` business object definition
----------------------------------------



### Fields

| Name                                                         | Type                                     | Required | Updatable | Personal | Description                                                                      |
|--------------------------------------------------------------|------------------------------------------|----------|-----------|----------|----------------------------------------------------------------------------------|
| `dsfrSocNom`                                                 | char(100)                                | yes*     | yes       |          | -                                                                                |
| `dsfrSocSite`                                                | url(100)                                 |          | yes       |          | -                                                                                |
| `dsfrSocPrivee`                                              | enum(100) using `DSFR_SOC_PRIVEE` list   | yes      | yes       |          | -                                                                                |
| `dsfrSocLogo`                                                | image                                    |          | yes       |          | -                                                                                |
| `dsfrSocSecteur`                                             | enum(100) using `DSFR_SOC_SECTEUR` list  | yes      | yes       |          | -                                                                                |

### Lists

* `DSFR_SOC_PRIVEE`
    - `PRV` Privée
    - `PUB` Publique
* `DSFR_SOC_SECTEUR`
    - `AS` Activité de services
    - `A` Agriculture
    - `AC` Arts et culture
    - `BTP` Bâtiment et travaux publiques
    - `JF` Juridique et financier
    - `TR` Tourisme - Restauration
    - `T` Transports
    - `U` Urbanisme

