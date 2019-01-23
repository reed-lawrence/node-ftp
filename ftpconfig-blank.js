"use strict";
// RENAME TO ftpconfig.js AND ADD TO GITIGNORE
exports.__esModule = true;
exports.ftpcreds = {
    host: 'ftp.mydestination.com',
    port: 21,
    user: 'ftpaccount@mydestination.com',
    pass: 'mypassword',
    cert_dns: 'DNS:my.certauthority.com'
};
exports.ftptargets = {
    from: './<output directory>',
    destination: '/<destination directory>'
};
