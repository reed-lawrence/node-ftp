import * as Client from 'ftp';
import * as fs from 'fs';
import * as glob from 'glob';
import { Promise } from 'es6-promise';
import { ftpcreds, ftptargets } from './ftpconfig';

const test = {
    allfiles: new Array(),
    folders: new Array(),
    files: new Array(),
    expectedDns: ftpcreds.cert_dns,
    getDirectories: (src: string) => {
        return new Promise<string[]>((resolve, reject) => {
            glob(src + '/**/*', (err, res) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(res);
                }
            });
        });
    },
    ftpAll: (src: string, destination: string) => {
        test.getDirectories(src).then(
            files => {
                test.allfiles = files;
                // console.log(test.allfiles);
                test.getAllFolders(test.allfiles).then(
                    getAllFoldersDone => {
                        test.getAllFiles(test.allfiles).then(
                            getAllFilesDone => {
                                console.log(test.folders);
                                console.log(test.files);
                                test.ftpExe(src, destination, test.folders, test.files).then(
                                    numFiles => console.log('Successfully transferred ' + numFiles)
                                );
                            }
                        )
                    }
                )
            }
        )
    },
    getAllFolders: (allFiles: string[]) => {
        return new Promise<boolean>(resolve => {
            for (let i = 0; i < allFiles.length; i++) {
                if (fs.statSync(allFiles[i]).isDirectory()) {
                    test.folders.push(allFiles[i]);
                }
                // if (allFiles[i].indexOf('.') === -1) {
                //     test.folders.push(allFiles[i]);
                // }
            }
            resolve(true)
        });
    },
    getAllFiles: (allFiles: string[]) => {
        return new Promise<boolean>(resolve => {
            for (let i = 0; i < allFiles.length; i++) {
                if (fs.statSync(allFiles[i]).isFile()) {
                    test.files.push(allFiles[i]);
                }
            }
            resolve(true);
        })
    },
    clearTargetDir: (client: Client, targetDir: string): Promise<boolean> => {
        return new Promise((resolve, reject) => {
            test.getTargetDirSubDirs(client, targetDir).then(
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
            )
        });
    },
    getTargetDirSubDirs: (client: Client, targetDir: string): Promise<string[]> => {
        return new Promise((resolve, reject) => {
            client.on('ready', () => {
                client.list(targetDir, (err, list) => {
                    if (err) {
                        throw err;
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
    },
    ftpExe: (rootDirFrom: string, basetargetdir: string, folders: string[], files: string[]) => {
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
                        if (cert.subjectaltname === test.expectedDns) {
                            return undefined;
                        } else {
                            throw "DNS Altname not as expected"
                        }
                    }
                }
            });
            test.clearTargetDir(client, basetargetdir).then(
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
                            const destFileName = files[i].replace('./output', basetargetdir)
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
                            this.promisesCompleted = true;
                            resolve(totaltransfers);
                        }
                    );
                }
            )

        });
    }
}

test.ftpAll(ftptargets.from, ftptargets.destination);




