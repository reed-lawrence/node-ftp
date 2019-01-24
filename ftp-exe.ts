import * as Client from 'ftp';
import * as fs from 'fs';
import * as glob from 'glob';
import { Promise } from 'es6-promise';
import { ftpcreds, ftptargets } from './ftpconfig';

export class FTP {
  directoryListing: string[] = [];
  folders: string[] = [];
  files: string[] = [];
  expectedDns = ftpcreds.cert_dns;

  async getDirectories(src: string): Promise<string[]> {
    return new Promise<string[]>((resolve, reject) => {
      glob(src + '/**/*', { dot: true }, (err, res) => {
        if (err) {
          reject(err);
        } else {
          resolve(res);
        }
      });
    });
  }

  async getAllFolders(directoryListing: string[]): Promise<boolean> {
    return new Promise<boolean>((resolve, reject) => {
      directoryListing.forEach(item => {
        if (fs.statSync(item).isDirectory()) {
          this.folders.push(item);
        }
      });
      resolve(true)
    });
  }

  async getAllFiles(directoryListing: string[]): Promise<boolean> {
    return new Promise<boolean>((resolve, reject) => {
      directoryListing.forEach(item => {
        if (fs.statSync(item).isFile()) {
          this.files.push(item);
        }
      });
    });
  }

  async getTargetSubdirectories(client: Client, targetDir: string): Promise<string[]> {
    return new Promise<string[]>((resolve, reject) => {
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

  async clearTargetDirectory(client: Client, targetDir: string): Promise<boolean> {
    return new Promise<boolean>((resolve, reject) => {
      this.getTargetSubdirectories(client, targetDir).then(
        folders => {
          const promises: Promise<boolean>[] = [];
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

  async ftpExe(rootDirFrom: string, basetargetdir: string, folders: string[], files: string[]): Promise<number> {
    return new Promise<number>((resolve, reject) => {
      const client = new Client();
      client.connect({
        user: ftpcreds.user,
        password: ftpcreds.pass,
        secure: true,
        host: ftpcreds.host,
        port: ftpcreds.port,
        secureOptions: {
          checkServerIdentity: (host, cert): Error => {
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
          const promises: Promise<boolean>[] = [];
          
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

  async execute(src: string, destination: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.getDirectories(src).then(
        files => {
          this.directoryListing = files;
          // console.log(test.allfiles);
          this.getAllFolders(this.directoryListing).then(
            getAllFoldersDone => {
              this.getAllFiles(this.directoryListing).then(
                getAllFilesDone => {
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
}

const ftp = new FTP();
ftp.execute(ftptargets.from, ftptargets.destination);




