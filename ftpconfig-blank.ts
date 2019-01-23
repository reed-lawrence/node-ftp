// RENAME TO ftpconfig.js AND ADD TO GITIGNORE

export const ftpcreds = {
  host: 'ftp.mydestination.com',
  port: 21,
  user: 'ftpaccount@mydestination.com',
  pass: 'mypassword',
  cert_dns: 'DNS:my.certauthority.com'
}

export const ftptargets = {
  from: './<output directory>',
  destination: '/<destination directory>'
}