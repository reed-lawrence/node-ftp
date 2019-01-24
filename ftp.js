var Client = require('ftp');
var fs = require('fs');
var glob = require('glob');
var ftpconfig = require('./ftpconfig');
var exec = require('child_process').execSync;


class FTP {
  constructor() {
    console.log(ftpconfig);
    this.directoryListing = new Array();
    this.folders = new Array();
    this.files = new Array();
    this.expectedDns = ftpconfig.ftpcreds.cert_dns;
  }

  getDirectories(src) {
    console.log('get directories called');
    return new Promise((resolve, reject) => {
      glob(src + '/**/*', {
        dot: true
      }, (err, res) => {
        if (err) {
          reject(err);
        } else {
          resolve(res);
        }
      });
    });
  }

  getAllFolders(directoryListing) {
    console.log('getAllFolders called');
    return new Promise((resolve, reject) => {
      directoryListing.forEach(item => {
        if (fs.statSync(item).isDirectory()) {
          this.folders.push(item);
        }
      });
      resolve(true)
    });
  }

  getAllFiles(directoryListing) {
    console.log('getAllFiles called');
    return new Promise((resolve, reject) => {
      directoryListing.forEach(item => {
        if (fs.statSync(item).isFile()) {
          this.files.push(item);
        }
      });
      resolve(true);
    });
  }

  getTargetSubdirectories(client, targetDir) {
    return new Promise((resolve, reject) => {
      client.on('ready', () => {
        client.list(targetDir, (err, list) => {
          if (err) {
            reject(err);
          } else {
            list = list.filter(_ => _.name !== '.' && _.name !== '..');
            const folders = new Array();
            list.forEach(file => {
              // console.log(file);
              if (file.type === 'd') {
                console.log('Found folder: ' + file.name);
                folders.push(file.name);
              }
            });
            resolve(folders);
          }
        });
      });
    });
  }

  clearTargetDirectory(client, targetDir) {
    return new Promise((resolve, reject) => {
      this.getTargetSubdirectories(client, targetDir).then(
        folders => {
          const promises = [];
          folders.forEach(folder => {
            promises.push(new Promise(r => {
              const targetDirname = targetDir + '/' + folder;
              console.log('Attempting to remove: ' + targetDirname);
              client.rmdir(targetDirname, true, (err) => {
                if (err) {
                  throw err;
                } else {
                  console.log('Removed - ' + targetDirname);
                  r(true);
                }
              });
            }));
          });

          Promise.all(promises).then(
            done => {
              console.log('All root directories removed recursively');
              resolve(true);
            }
          );
        }
      );
    });
  }

  ftpExe(rootDirFrom, basetargetdir, folders, files) {
    console.log('ftpExe called');
    return new Promise((resolve, reject) => {
      const client = new Client();
      console.log('client created');
      client.connect({
        user: ftpconfig.ftpcreds.user,
        password: ftpconfig.ftpcreds.pass,
        secure: true,
        host: ftpconfig.ftpcreds.host,
        port: ftpconfig.ftpcreds.port,
        secureOptions: {
          checkServerIdentity: (host, cert) => {
            if (cert.subjectaltname === this.expectedDns) {
              return undefined;
            } else {
              throw "DNS Altname not as expected"
            }
          }
        }
      });
      this.clearTargetDirectory(client, basetargetdir).then(
        cleared => {
          console.log('Cleared status: ' + cleared);
          const totaltransfers = folders.length + files.length;
          const promises = [];

          for (let i = 0; i < folders.length; i++) {
            promises.push(new Promise(r => {
              const destDirName = folders[i].replace(rootDirFrom, basetargetdir);
              console.log('Attempting to make directory: ' + destDirName);
              client.mkdir(destDirName, (err) => {
                if (err) {
                  console.error('Unable to make directory: ' + destDirName);
                  throw err
                } else {
                  console.log('Success - ' + destDirName);
                  r(true);
                };
              });
            }));
          }

          for (let i = 0; i < files.length; i++) {
            promises.push(new Promise(r => {
              const destFileName = files[i].replace(rootDirFrom, basetargetdir)
              console.log('Attempting to write file: ' + destFileName);
              client.put(files[i], destFileName, (err) => {
                if (err) {
                  console.error('Unable to create file: ' + destFileName);
                  throw err;
                } else {
                  console.log('Success - ' + destFileName);
                  r(true);
                }
              });
            }));
          }

          Promise.all(promises).then(
            done => {
              console.log('All transfers completed successully');
              client.end();
              resolve(totaltransfers);
            }
          );
        }
      )
    });
  }

  execute(src, destination) {
    console.log('execute called');
    return new Promise((resolve, reject) => {
      this.getDirectories(src).then(
        files => {
          console.log(files);
          this.directoryListing = files;
          // console.log(test.allfiles);
          this.getAllFolders(this.directoryListing).then(
            getAllFoldersDone => {
              this.getAllFiles(this.directoryListing).then(
                getAllFilesDone => {
                  console.log('getAllFiles done');
                  console.log(this.folders);
                  console.log(this.files);
                  this.ftpExe(src, destination, this.folders, this.files).then(
                    numFiles => {
                      console.log('Successfully transferred ' + numFiles);
                      resolve();
                    }
                  );
                }
              );
            }
          );
        }
      );
    });
  }
  test(string){
    console.log(string);
  }
}

exec('powershell -c (New-Object Media.SoundPlayer "C:\Users\Reed\source\repos\node-ftp\alert.wav").PlaySync()');
var ftp = new FTP();
// ftp.execute('./output', '/test_ftp').then(
//   resolve => {
//     console.log('Done!');
//   }
// );

// ""powershell -c (New-Object Media.SoundPlayer "C:\Windows\media\Windows Notify System Generic.wav").PlaySync()"";