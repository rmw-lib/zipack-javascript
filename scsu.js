/**
 * SCSU - Standard Compression Scheme for Unicode implementation for JavaScript
 *
 * Provides SCSU encoding/decoding of  UTF-8 strings
 * Suitable for better LZF encodeion for UTF-8 strings
 * Based on Java source of SCSU by Unicode, Inc. (http://www.unicode.org/reports/tr6/)
 *
 * @class  Provides methods for SCSU encoding/decoding
 * @author   Alexey A.Znaev (znaeff@mail.ru) (http://xbsoft.org)
 * @copyright   Copyright (C) 2011-2012 Alexey A.Znaev
 * @license   http://www.gnu.org/licenses GNU Public License version 3
 * @version   1.0
 */
function SCSU(){}

// class constants

SCSU.prototype._SQ0 = 0x01;
SCSU.prototype._SQ1 = 0x02;
SCSU.prototype._SQ2 = 0x03;
SCSU.prototype._SQ3 = 0x04;
SCSU.prototype._SQ4 = 0x05;
SCSU.prototype._SQ5 = 0x06;
SCSU.prototype._SQ6 = 0x07;
SCSU.prototype._SQ7 = 0x08;

SCSU.prototype._SDX = 0x0B;
SCSU.prototype._Srs = 0x0C;

SCSU.prototype._SQU = 0x0E;
SCSU.prototype._SCU = 0x0F;

SCSU.prototype._SC0 = 0x10;
SCSU.prototype._SC1 = 0x11;
SCSU.prototype._SC2 = 0x12;
SCSU.prototype._SC3 = 0x13;
SCSU.prototype._SC4 = 0x14;
SCSU.prototype._SC5 = 0x15;
SCSU.prototype._SC6 = 0x16;
SCSU.prototype._SC7 = 0x17;
SCSU.prototype._SD0 = 0x18;
SCSU.prototype._SD1 = 0x19;
SCSU.prototype._SD2 = 0x1A;
SCSU.prototype._SD3 = 0x1B;
SCSU.prototype._SD4 = 0x1C;
SCSU.prototype._SD5 = 0x1D;
SCSU.prototype._SD6 = 0x1E;
SCSU.prototype._SD7 = 0x1F;

SCSU.prototype._UC0 = 0xE0;
SCSU.prototype._UC1 = 0xE1;
SCSU.prototype._UC2 = 0xE2;
SCSU.prototype._UC3 = 0xE3;
SCSU.prototype._UC4 = 0xE4;
SCSU.prototype._UC5 = 0xE5;
SCSU.prototype._UC6 = 0xE6;
SCSU.prototype._UC7 = 0xE7;
SCSU.prototype._UD0 = 0xE8;
SCSU.prototype._UD1 = 0xE9;
SCSU.prototype._UD2 = 0xEA;
SCSU.prototype._UD3 = 0xEB;
SCSU.prototype._UD4 = 0xEC;
SCSU.prototype._UD5 = 0xED;
SCSU.prototype._UD6 = 0xEE;
SCSU.prototype._UD7 = 0xEF;

SCSU.prototype._UQU = 0xF0;
SCSU.prototype._UDX = 0xF1;
SCSU.prototype._Urs = 0xF2;

SCSU.prototype._gapThreshold = 0x68;
SCSU.prototype._gapOffset = 0xAC00;

SCSU.prototype._reservedStart = 0xA8;
SCSU.prototype._fixedThreshold = 0xF9;

SCSU.prototype._fixedOffset = [0x00C0,0x0250,0x0370,0x0530,0x3040,0x30A0,0xFF60];

SCSU.prototype._staticOffset = [0x0000,0x0080,0x0100,0x0300,0x2000,0x2080,0x2100,0x3000];

SCSU.prototype._initialDynamicOffset = [0x0080,0x00C0,0x0400,0x0600,0x0900,0x3040,0x30A0,0xFF00];

// methods

// public methods

// encoding related public methods

/**
 * Encodes UTF-8 string using SCSU algorithm
 *
 * @param     {String} str UTF-8 string
 * @return     {String} SCSU-encoded string
 * @throws     {SCSUError}
 */
SCSU.prototype.encode = function(str){
  var iLen = 0, ch, ch2, iprevWindow;
  this._reset();
  this.sIn = str;
  this.iInLen = str.length;
  this.aOut = [];
  while (this.iIn < this.iInLen){
    if(this.iSCU != -1){
      ch = this._outputUnicodeRun();
      if(this.aOut.length - this.iSCU == 3 ){
        this.aOut[this.iSCU] = this._SQU;
        this.iSCU = -1;
        continue;
      }else{
        this.iSCU = -1;
        this.fUnicodeMode = true;
      }
    }else ch = this._outputSingleByteRun();
    if(this.iIn == this.iInLen) break;
    for(var ich = this.iIn; ch < 0x80; ich++){
      if(ich == this.iInLen || !this._isCompressible(this.sIn.charCodeAt(ich))){
        ch = this.sIn.charCodeAt(this.iIn);
        break;
      }
      ch = this.sIn.charCodeAt(ich);
    }
    iprevWindow = this.iSelectedWindow;
    if(ch < 0x80 || this._locateWindow(ch, this.dynamicOffset)){
      if(!this.fUnicodeMode && this.iIn < this.iInLen -1){
        ch2 = this.sIn.charCodeAt(this.iIn + 1);
        if(ch2 >= this.dynamicOffset[iprevWindow] && ch2 < this.dynamicOffset[iprevWindow] + 0x80){
          this._quoteSingleByte(ch);
          this.iSelectedWindow = iprevWindow;
          continue;
        }
      }
      this.aOut.push(((this.fUnicodeMode ? this._UC0 : this._SC0) + this.iSelectedWindow) & 255);
      this.fUnicodeMode = false;
    }else if(!this.fUnicodeMode && this._locateWindow(ch, this._staticOffset)){
      this._quoteSingleByte(ch);
      this.iSelectedWindow = iprevWindow;
      continue;
    }else if(this._positionWindow(ch) ){
      this.fUnicodeMode = false;
    }else{
      this.iSCU = this.aOut.length;
      this.aOut.push(this._SCU);
      continue;
    }
  }
  delete this.sIn;
  // var a_out_symbols = [];
  // for(var i=0; i<this.aOut.length; i++) a_out_symbols.push(String.fromCharCode(this.aOut[i]));
  var out = this.aOut;
  delete this.aOut;
  return out;
}

// decoding related public methods

/**
 * Decodes SCSU-encoded string to UTF-8 one
 *
 * @param     {String} str SCSU-encoded string
 * @return     {String} UTF-8 string
 * @throws     {SCSUError}
 */
SCSU.prototype.decode = function(str){
  this._reset();
  this.sIn = str;
  this.iInLen = str.length;
  var sOut = '';
  var iStaticWindow, iDynamicWindow, ch;
  Loop:
  for(var iCur = 0; iCur < this.iInLen; iCur++ ){
    iStaticWindow = 0;
    iDynamicWindow = this.iSelectedWindow;
    ch = str[iCur]
    Switch:
    switch(ch){
      case this._SQ0:
      case this._SQ1:
      case this._SQ2:
      case this._SQ3:
      case this._SQ4:
      case this._SQ5:
      case this._SQ6:
      case this._SQ7:
        if(iCur >= this.iInLen - 1) break Loop;
        iDynamicWindow = iStaticWindow = ch - this._SQ0;
        iCur++;
      default:
        ch = str[iCur];
        if(ch < 128){
          ch = ch + this._staticOffset[iStaticWindow];
          sOut += String.fromCharCode(ch);
        }else{
          ch -= 0x80;
          ch += this.dynamicOffset[iDynamicWindow];
          if(ch < 1<<16){
            sOut += String.fromCharCode(ch);
          }else{
            ch -= 0x10000;
            sOut += String.fromCharCode(0xD800 + (ch>>10));
            sOut += String.fromCharCode(0xDC00 + (ch & ~0xFC00));
          }
        }
        break;
      case this._SDX:
        iCur += 2;
        if(iCur >= this.iInLen) break Loop;
        this._defineExtendedWindow(this._charFromTwoBytes(str[iCur-1], str[iCur]));
        break;
      case this._SD0:
      case this._SD1:
      case this._SD2:
      case this._SD3:
      case this._SD4:
      case this._SD5:
      case this._SD6:
      case this._SD7:
        iCur ++;
        if(iCur >= this.iInLen) break Loop;
        this._defineWindow(str[iCur-1] - this._SD0, str[iCur]);
        break;
      case this._SC0:
      case this._SC1:
      case this._SC2:
      case this._SC3:
      case this._SC4:
      case this._SC5:
      case this._SC6:
      case this._SC7:
        this.iSelectedWindow = str[iCur] - this._SC0;
        break;
      case this._SCU:
        iCur++;
        for(var b; iCur < this.iInLen - 1; iCur+=2){
          b = str[iCur];
          if(b >= this._UC0 && b <= this._UC7){
            this.iSelectedWindow = b - this._UC0;
            break Switch;
          }else if(b >= this._UD0 && b <= this._UD7){
            this._defineWindow(b - this._UD0, str[iCur+1]);
            iCur++;
            break Switch;
          }else if(b == this._UDX){
            this._defineExtendedWindow(this._charFromTwoBytes(str[iCur+1], str[iCur+2]));
            iCur += 2;
            break Switch;
          }else if(b == this._UQU){
            iCur++;
          }
          sOut += String.fromCharCode(this._charFromTwoBytes(str[iCur], str[iCur+1]));
        }
        if(iCur != this.iInLen) throw new SCSUError(this._errorText(0x11));
        break;
      case this._SQU:
        iCur += 2;
        if(iCur >= this.iInLen){
          break Loop;
        }else{
          ch = this._charFromTwoBytes(str[iCur-1], str[iCur]);
          sOut += String.fromCharCode(ch);
        }
        break;
      case this._Srs:
        throw new SCSUError(this._errorText(0x16, 'Pos. ' + iCur + '.'));
    }
  }
  delete this.sIn;
  if(iCur < this.iInLen) throw new SCSUError(this._errorText(0x11));
  return sOut;
}

// private methods

// common private methods

SCSU.prototype._isCompressible = function(ch) {
  return (ch < 0x3400 || ch >= 0xE000);
}

SCSU.prototype._reset = function(){
  this.iIn = 0;
  this.iSelectedWindow = 0;
  this.dynamicOffset = this._initialDynamicOffset.slice(0);
  this.iSCU = -1;
  this.fUnicodeMode = false;
  this.iNextWindow = 3;
}

// encoding related private methods

SCSU.prototype._locateWindow = function(ch, offsetTable){
  var iWin = this.iSelectedWindow;
  if(iWin != - 1 && ch >= offsetTable[iWin] && ch < offsetTable[iWin] + 0x80) return true;
  for(iWin = 0; iWin < offsetTable.length; iWin++){
    if(ch >= offsetTable[iWin] && ch < offsetTable[iWin] + 0x80){
      this.iSelectedWindow = iWin;
      return true;
    }
  }
  return false;
}

SCSU.prototype._isAsciiCrLfOrTab = function(ch){
  return (ch >= 0x20 && ch <= 0x7F) || ch == 0x09 || ch == 0x0A || ch == 0x0D;
}

SCSU.prototype._outputSingleByteRun = function(){
  var iWin = this.iSelectedWindow, ch, ch2, byte1, byte2, aInLen;
  while(this.iIn < this.iInLen){
    this.iOutLen = 0;
    byte1 = 0;
    byte2 = 0;
    ch = this.sIn.charCodeAt(this.iIn);
    aInLen = 1;
    if((ch & 0xF800) == 0xD800 ){
      if((ch & 0xFC00) == 0xDC00 ){
        throw new SCSUError(this._errorText(0x12, 'Byte #' + this.iIn + '.'));
      }else{
        if(this.iIn >= this.iInLen - 1) throw new SCSUError(this._errorText(0x11));
        ch2 = this.sIn.charCodeAt(this.iIn + 1);
        if((ch2 & 0xFC00) != 0xDC00 ) throw new SCSUError(this._errorText(0x13, 'Byte #' + (this.iIn + 1) + '.'));
        ch = ((ch - 0xD800)<<10 | (ch2-0xDC00)) + 0x10000;
        aInLen = 2;
      }
    }
    if(this._isAsciiCrLfOrTab(ch) || ch == 0){
      byte2 = ch & 0x7F;
      this.iOutLen = 1;
    }else if(ch < 0x20){
      byte1 = this._SQ0;
      byte2 = ch;
      this.iOutLen = 2;
    }else if(ch >= this.dynamicOffset[iWin] && ch < this.dynamicOffset[iWin] + 0x80){
      ch -= this.dynamicOffset[iWin];
      byte2 = (ch | 0x80) & 255;
      this.iOutLen = 1;
    }
    switch(this.iOutLen){
      default:
        return ch;
      case 2:
        this.aOut.push(byte1);
      case 1:
        this.aOut.push(byte2);
        break;
    }
    this.iIn += aInLen;
  }
  return 0;
}

SCSU.prototype._quoteSingleByte = function(ch){
  var iWin = this.iSelectedWindow, ch;
  this.aOut.push((this._SQ0 + iWin) & 255);
  if(ch >= this.dynamicOffset[iWin] && ch < this.dynamicOffset[iWin] + 0x80){
    ch -= this.dynamicOffset[iWin];
    this.aOut.push((ch | 0x80) & 255);
  }else if(ch >= this._staticOffset[iWin] && ch < this._staticOffset[iWin] + 0x80){
    ch -= this._staticOffset[iWin];
    this.aOut.push(ch & 255);
  }else throw new SCSUError(this._errorText(0x00, 'ch = ' + ch + ' not valid in _quoteSingleByte.'));
  this.iIn++;
}

SCSU.prototype._outputUnicodeRun = function(){
  var ch = 0, ch2;
  while(this.iIn < this.iInLen){
    ch = this.sIn.charCodeAt(this.iIn);
    this.iOutLen = 2;
    if(this._isCompressible(ch)){
      if( this.iIn < this.iInLen - 1){
        ch2 = this.sIn.charCodeAt(this.iIn + 1);
        if(this._isCompressible(ch2)) break;
      }
      if(ch >= 0xE000 && ch <= 0xF2FF) this.iOutLen = 3;
    }
    if(this.iOutLen == 3) this.aOut.push(this._UQU);
    this.aOut.push((ch >> 8) & 255);
    this.aOut.push(ch & 0xFF);
    this.iIn++;
  }
  return ch;
}

SCSU.prototype._positionWindow = function(ch){
  var iWin = this.iNextWindow % 8, iPosition = 0, ch;
  if(ch < 0x80) throw new SCSUError(this._errorText(0x00, 'ch < 0x80.'));
  for(var i = 0; i < this._fixedOffset.length; i++){
    if(ch >= this._fixedOffset[i] && ch < this._fixedOffset[i] + 0x80){
      iPosition = i;
      break;
    }
  }
  if(iPosition != 0){
    this.dynamicOffset[iWin] = this._fixedOffset[iPosition];
    iPosition += 0xF9;
  }else if(ch < 0x3400){
    iPosition = ch >> 7;
    this.dynamicOffset[iWin] = ch & 0xFF80;
  }else if(ch < 0xE000){
    return false;
  }else if(ch <= 0xFFFF){
    iPosition =  ((ch - this._gapOffset) >> 7);
    this.dynamicOffset[iWin] = ch & 0xFF80;
  }else{
    iPosition = (ch - 0x10000) >> 7;
    iPosition |= iWin << 13;
    this.dynamicOffset[iWin] = ch & 0x1FFF80;
  }
  if(iPosition < 0x100){
    this.aOut.push(((this.fUnicodeMode ? this._UD0 : this._SD0) + iWin) & 255);
    this.aOut.push(iPosition & 0xFF);
  }else if(iPosition >= 0x100){
    this.aOut.push(this.fUnicodeMode ? this._UDX : this._SDX);
    this.aOut.push((iPosition >> 8) & 0xFF);
    this.aOut.push(iPosition & 0xFF);
  }
  this.iSelectedWindow = iWin;
  this.iNextWindow++;
  return true;
}

// decoding related private methods

SCSU.prototype._defineWindow = function(iWin, bOffset){
  var iOffset = (bOffset < 0 ? bOffset + 256 : bOffset);
  if(iOffset == 0){
    throw new SCSUError(this._errorText(0x14));
  }else if(iOffset < this._gapThreshold){
    this.dynamicOffset[iWin] = iOffset << 7;
  }else if(iOffset < this._reservedStart){
    this.dynamicOffset[iWin] = (iOffset << 7) + this._gapOffset;
  }else if(iOffset < this._fixedThreshold){
    throw new SCSUError(this._errorText(0x15, 'Value = ' + iOffset + '.'));
  }else{
    this.dynamicOffset[iWin] = this._fixedOffset[iOffset - this._fixedThreshold];
  }
  this.iSelectedWindow = iWin;
}

SCSU.prototype._defineExtendedWindow = function(chOffset){
  var iWin = chOffset >> 13;
  this.dynamicOffset[iWin] = ((chOffset & 0x1FFF) << 7) + (1 << 16);
  this.iSelectedWindow = iWin;
}

SCSU.prototype._charFromTwoBytes = function(hi, lo){
  var ch = (lo >= 0 ? lo : 256 + lo);
  return (ch + ((hi >= 0 ? hi : 256 + hi)<<8));
}

// exceptions related private stuff

SCSU.prototype._ERRORS = {
  0x00 : 'Internal error.',
  0x10 : 'Illegal input.',
  0x11 : 'Ended prematurely.',
  0x12 : 'Unpaired low surrogate.',
  0x13 : 'Unpaired high surrogate.',
  0x14 : 'Zero offset.',
  0x15 : 'Bad offset.',
  0x16 : 'Srs byte found.',
  0x20 : 'Bad output.'
};

SCSU.prototype._errorText = function(code, text){
  if(code == null || (typeof code != 'number') || code < 0 || code > 0xFF) code = 0x00;
  if(text == null || (typeof text != 'string')) text = '';
  var message = '';
  var code_class = code & 0xF0;
  if(this._ERRORS[code_class]) message = this._ERRORS[code_class];
  if((code != code_class) && this._ERRORS[code]) message += ' ' + this._ERRORS[code];
  return('SCSU 0x' + code.toString(16) + ': ' + message + (text==''? '':' ') + text);
}

/**
 * SCSU Errors exceptions
 *
 * @class  Constructs exceptions of SCSU errors
 * @author   Alexey A.Znaev (znaeff@mail.ru) (http://xbsoft.org)
 * @copyright   Copyright (C) 2011-2012 Alexey A.Znaev
 * @license   http://www.gnu.org/licenses GNU Public License version 3
 * @version   1.0
 */
function SCSUError(msg){ this.message = msg; this.name = 'SCSUError'};
SCSUError.prototype = new Error();
export default new SCSU()
