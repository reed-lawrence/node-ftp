"use strict";
var _this = this;
exports.__esModule = true;
var Client = require("ftp");
var fs = require("fs");
var glob = require("glob");
var es6_promise_1 = require("es6-promise");
var ftpconfig_1 = require("./ftpconfig");
var test = {
    allfiles: new Array(),
    folders: new Array(),
    files: new Array(),
    expectedDns: ftpconfig_1.ftpcreds.cert_dns,
    getDirectories: function (src) {
        return new es6_promise_1.Promise(function (resolve, reject) {
            glob(src + '/**/*', function (err, res) {
                if (err) {
                    reject(err);
                }
                else {
                    resolve(res);
                }
            });
        });
    },
    ftpAll: function (src, destination) {
        test.getDirectories(src).then(function (files) {
            test.allfiles = files;
            // console.log(test.allfiles);
            test.getAllFolders(test.allfiles).then(function (getAllFoldersDone) {
                test.getAllFiles(test.allfiles).then(function (getAllFilesDone) {
                    console.log(test.folders);
                    console.log(test.files);
                    test.ftpExe(src, destination, test.folders, test.files).then(function (numFiles) { return console.log('Successfully transferred ' + numFiles); });
                });
            });
        });
    },
    getAllFolders: function (allFiles) {
        return new es6_promise_1.Promise(function (resolve) {
            for (var i = 0; i < allFiles.length; i++) {
                if (fs.statSync(allFiles[i]).isDirectory()) {
                    test.folders.push(allFiles[i]);
                }
                // if (allFiles[i].indexOf('.') === -1) {
                //     test.folders.push(allFiles[i]);
                // }
            }
            resolve(true);
        });
    },
    getAllFiles: function (allFiles) {
        return new es6_promise_1.Promise(function (resolve) {
            for (var i = 0; i < allFiles.length; i++) {
                if (fs.statSync(allFiles[i]).isFile()) {
                    test.files.push(allFiles[i]);
                }
            }
            resolve(true);
        });
    },
    clearTargetDir: function (client, targetDir) {
        return new es6_promise_1.Promise(function (resolve, reject) {
            test.getTargetDirSubDirs(client, targetDir).then(function (folders) {
                var promises = [];
                folders.forEach(function (folder) {
                    promises.push(new es6_promise_1.Promise(function (r) {
                        var targetDirname = targetDir + '/' + folder;
                        console.log('Attempting to remove: ' + targetDirname);
                        client.rmdir(targetDirname, true, function (err) {
                            if (err) {
                                throw err;
                            }
                            else {
                                console.log('Removed - ' + targetDirname);
                                r(true);
                            }
                        });
                    }));
                });
                es6_promise_1.Promise.all(promises).then(function (done) {
                    console.log('All root directories removed recursively');
                    resolve(true);
                });
            });
        });
    },
    getTargetDirSubDirs: function (client, targetDir) {
        return new es6_promise_1.Promise(function (resolve, reject) {
            client.on('ready', function () {
                client.list(targetDir, function (err, list) {
                    if (err) {
                        throw err;
                    }
                    else {
                        list = list.filter(function (_) { return _.name !== '.' && _.name !== '..'; });
                        var folders_1 = new Array();
                        list.forEach(function (file) {
                            // console.log(file);
                            if (file.type === 'd') {
                                console.log('Found folder: ' + file.name);
                                folders_1.push(file.name);
                            }
                        });
                        resolve(folders_1);
                    }
                });
            });
        });
    },
    ftpExe: function (rootDirFrom, basetargetdir, folders, files) {
        return new es6_promise_1.Promise(function (resolve, reject) {
            var client = new Client();
            client.connect({
                user: ftpconfig_1.ftpcreds.user,
                password: ftpconfig_1.ftpcreds.pass,
                secure: true,
                host: ftpconfig_1.ftpcreds.host,
                port: ftpconfig_1.ftpcreds.port,
                secureOptions: {
                    checkServerIdentity: function (host, cert) {
                        if (cert.subjectaltname === test.expectedDns) {
                            return undefined;
                        }
                        else {
                            throw "DNS Altname not as expected";
                        }
                    }
                }
            });
            test.clearTargetDir(client, basetargetdir).then(function (cleared) {
                console.log('Cleared status: ' + cleared);
                var totaltransfers = folders.length + files.length;
                var promises = [];
                var _loop_1 = function (i) {
                    promises.push(new es6_promise_1.Promise(function (r) {
                        var destDirName = folders[i].replace(rootDirFrom, basetargetdir);
                        console.log('Attempting to make directory: ' + destDirName);
                        client.mkdir(destDirName, function (err) {
                            if (err) {
                                console.error('Unable to make directory: ' + destDirName);
                                throw err;
                            }
                            else {
                                console.log('Success - ' + destDirName);
                                r(true);
                            }
                            ;
                        });
                    }));
                };
                for (var i = 0; i < folders.length; i++) {
                    _loop_1(i);
                }
                var _loop_2 = function (i) {
                    promises.push(new es6_promise_1.Promise(function (r) {
                        var destFileName = files[i].replace('./output', basetargetdir);
                        console.log('Attempting to write file: ' + destFileName);
                        client.put(files[i], destFileName, function (err) {
                            if (err) {
                                console.error('Unable to create file: ' + destFileName);
                                throw err;
                            }
                            else {
                                console.log('Success - ' + destFileName);
                                r(true);
                            }
                        });
                    }));
                };
                for (var i = 0; i < files.length; i++) {
                    _loop_2(i);
                }
                es6_promise_1.Promise.all(promises).then(function (done) {
                    console.log('All transfers completed successully');
                    client.end();
                    _this.promisesCompleted = true;
                    resolve(totaltransfers);
                });
            });
        });
    }
};
test.ftpAll(ftpconfig_1.ftptargets.from, ftpconfig_1.ftptargets.destination);
