"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
exports.__esModule = true;
var Client = require("ftp");
var fs = require("fs");
var glob = require("glob");
var es6_promise_1 = require("es6-promise");
var ftpconfig_1 = require("./ftpconfig");
var FTP = /** @class */ (function () {
    function FTP() {
        this.directoryListing = [];
        this.folders = [];
        this.files = [];
        this.expectedDns = ftpconfig_1.ftpcreds.cert_dns;
    }
    FTP.prototype.getDirectories = function (src) {
        return __awaiter(this, void 0, es6_promise_1.Promise, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, new es6_promise_1.Promise(function (resolve, reject) {
                        glob(src + '/**/*', { dot: true }, function (err, res) {
                            if (err) {
                                reject(err);
                            }
                            else {
                                resolve(res);
                            }
                        });
                    })];
            });
        });
    };
    FTP.prototype.getAllFolders = function (directoryListing) {
        return __awaiter(this, void 0, es6_promise_1.Promise, function () {
            var _this = this;
            return __generator(this, function (_a) {
                return [2 /*return*/, new es6_promise_1.Promise(function (resolve, reject) {
                        directoryListing.forEach(function (item) {
                            if (fs.statSync(item).isDirectory()) {
                                _this.folders.push(item);
                            }
                        });
                        resolve(true);
                    })];
            });
        });
    };
    FTP.prototype.getAllFiles = function (directoryListing) {
        return __awaiter(this, void 0, es6_promise_1.Promise, function () {
            var _this = this;
            return __generator(this, function (_a) {
                return [2 /*return*/, new es6_promise_1.Promise(function (resolve, reject) {
                        directoryListing.forEach(function (item) {
                            if (fs.statSync(item).isFile()) {
                                _this.files.push(item);
                            }
                        });
                    })];
            });
        });
    };
    FTP.prototype.getTargetSubdirectories = function (client, targetDir) {
        return __awaiter(this, void 0, es6_promise_1.Promise, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, new es6_promise_1.Promise(function (resolve, reject) {
                        client.on('ready', function () {
                            client.list(targetDir, function (err, list) {
                                if (err) {
                                    reject(err);
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
                    })];
            });
        });
    };
    FTP.prototype.clearTargetDirectory = function (client, targetDir) {
        return __awaiter(this, void 0, es6_promise_1.Promise, function () {
            var _this = this;
            return __generator(this, function (_a) {
                return [2 /*return*/, new es6_promise_1.Promise(function (resolve, reject) {
                        _this.getTargetSubdirectories(client, targetDir).then(function (folders) {
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
                    })];
            });
        });
    };
    FTP.prototype.ftpExe = function (rootDirFrom, basetargetdir, folders, files) {
        return __awaiter(this, void 0, es6_promise_1.Promise, function () {
            var _this = this;
            return __generator(this, function (_a) {
                return [2 /*return*/, new es6_promise_1.Promise(function (resolve, reject) {
                        var client = new Client();
                        client.connect({
                            user: ftpconfig_1.ftpcreds.user,
                            password: ftpconfig_1.ftpcreds.pass,
                            secure: true,
                            host: ftpconfig_1.ftpcreds.host,
                            port: ftpconfig_1.ftpcreds.port,
                            secureOptions: {
                                checkServerIdentity: function (host, cert) {
                                    if (cert.subjectaltname === _this.expectedDns) {
                                        return undefined;
                                    }
                                    else {
                                        throw "DNS Altname not as expected";
                                    }
                                }
                            }
                        });
                        _this.clearTargetDirectory(client, basetargetdir).then(function (cleared) {
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
                                    var destFileName = files[i].replace(rootDirFrom, basetargetdir);
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
                                resolve(totaltransfers);
                            });
                        });
                    })];
            });
        });
    };
    FTP.prototype.execute = function (src, destination) {
        return __awaiter(this, void 0, es6_promise_1.Promise, function () {
            var _this = this;
            return __generator(this, function (_a) {
                return [2 /*return*/, new es6_promise_1.Promise(function (resolve, reject) {
                        _this.getDirectories(src).then(function (files) {
                            _this.directoryListing = files;
                            // console.log(test.allfiles);
                            _this.getAllFolders(_this.directoryListing).then(function (getAllFoldersDone) {
                                _this.getAllFiles(_this.directoryListing).then(function (getAllFilesDone) {
                                    console.log(_this.folders);
                                    console.log(_this.files);
                                    _this.ftpExe(src, destination, _this.folders, _this.files).then(function (numFiles) {
                                        console.log('Successfully transferred ' + numFiles);
                                        resolve();
                                    });
                                });
                            });
                        });
                    })];
            });
        });
    };
    return FTP;
}());
exports.FTP = FTP;
var ftp = new FTP();
ftp.execute(ftpconfig_1.ftptargets.from, ftpconfig_1.ftptargets.destination);
