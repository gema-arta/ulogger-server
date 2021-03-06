/*
 * μlogger
 *
 * Copyright(C) 2019 Bartek Fabiszewski (www.fabiszewski.net)
 *
 * This is free software; you can redistribute it and/or modify it under
 * the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful, but
 * WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
 * General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program; if not, see <http://www.gnu.org/licenses/>.
 */

export default class uUtils {

  /**
   * Set cookie
   * @param {string} name
   * @param {(string|number)} value
   * @param {?number=} days Default validity is 30 days, null = never expire
   */
  static setCookie(name, value, days = 30) {
    let expires = '';
    if (days) {
      const date = new Date();
      date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
      expires = `; expires=${date.toUTCString()}`;
    }
    document.cookie = `ulogger_${name}=${value}${expires}; path=/; samesite=lax`;
  }

  /**
   * sprintf, naive approach, only %s, %d supported
   * @param {string} fmt String
   * @param {...(string|number)=} params Optional parameters
   * @returns {string}
   */
  static sprintf(fmt, ...params) {
    let i = 0;
    const ret = fmt.replace(/%%|%s|%d/g, (match) => {
      if (match === '%%') {
        return '%';
      } else if (match === '%d' && isNaN(params[i]) && typeof params[i] !== 'undefined') {
        throw new Error(`Wrong format specifier ${match} for ${params[i]} argument`);
      }
      if (typeof params[i] === 'undefined') {
        throw new Error(`Missing argument for format specifier ${match}`);
      }
      return params[i++];
    });
    if (i < params.length) {
      throw new Error(`Unused argument for format specifier ${fmt}`);
    }
    return ret;
  }

  /**
   * Add script tag
   * @param {string} url attribute
   * @param {string} id attribute
   * @param {Function=} onload
   * @param {Function=} onerror
   */
  // eslint-disable-next-line max-params
  static addScript(url, id, onload, onerror) {
    if (id && document.getElementById(id)) {
      if (onload instanceof Function) {
        onload();
      }
      return;
    }
    const tag = document.createElement('script');
    tag.type = 'text/javascript';
    tag.src = url;
    if (id) {
      tag.id = id;
    }
    tag.async = true;
    if (onload instanceof Function) {
      tag.onload = onload;
    }
    if (onerror instanceof Function) {
      tag.onerror = () => onerror(new Error(`error loading ${id} script`));
    }

    document.getElementsByTagName('head')[0].appendChild(tag);
  }

  /**
   * Load script with timeout
   * @param {string} url URL
   * @param {string} id Element id
   * @param {number=} ms Timeout in ms
   * @return {Promise<void, Error>}
   */
  static loadScript(url, id, ms = 10000) {
    const scriptLoaded = new Promise(
      (resolve, reject) => uUtils.addScript(url, id, resolve, reject));
    const timeout = this.timeoutPromise(ms);
    return Promise.race([ scriptLoaded, timeout ]);
  }

  /**
   * Promise rejected after given time
   * @param {number} ms Time in milliseconds
   * @return {Promise<void, Error>}
   */
  static timeoutPromise(ms) {
    return new Promise((resolve, reject) => {
      const tid = setTimeout(() => {
        clearTimeout(tid);
        reject(new Error(`timeout (${ms} ms).`));
      }, ms);
    });
  }

  /**
   * Encode string for HTML
   * @param {string} s
   * @returns {string}
   */
  static htmlEncode(s) {
    return s.replace(/&/g, '&amp;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  /**
   * Convert hex string and opacity to an rgba string
   * @param {string} hex
   * @param {number=} opacity
   * @returns {string}
   */
  static hexToRGBA(hex, opacity) {
    opacity = typeof opacity !== 'undefined' ? opacity : 1;
    return `rgba(${(hex = hex.replace('#', ''))
      .match(new RegExp(`(.{${hex.length / 3}})`, 'g'))
      .map((l) => parseInt(hex.length % 2 ? l + l : l, 16))
      .concat(opacity).join(',')})`;
  }

  /**
   * Get rgb color for given scale and intensity
   * @param {number[]} start Minimum scale color as [ r, g, b ]
   * @param {number[]} end Maximum scale color as [ r, g, b ]
   * @param {number} intensity Intensity from 0 to 1
   * @return {string} Color as rgb() string
   */
  static getScaleColor(start, end, intensity) {
    if (intensity < 0 || intensity > 1) {
      throw new Error('Invalid value');
    }
    const rgb = [];
    for (let i = 0; i < 3; i++) {
      if (start[i] < 0 || start[i] > 255 || end[i] < 0 || end[i] > 255) {
        throw new Error('Invalid value');
      }
      rgb[i] = Math.round((end[i] - start[i]) * intensity + start[i]);
    }
    return `rgb(${rgb[0]}, ${rgb[1]}, ${rgb[2]})`;
  }

  /**
   * Add link tag with type css
   * @param {string} url attribute
   * @param {string=} id attribute
   */
  static addCss(url, id) {
    if (id && document.getElementById(id)) {
      return;
    }
    const tag = document.createElement('link');
    tag.type = 'text/css';
    tag.rel = 'stylesheet';
    tag.href = url;
    if (id) {
      tag.id = id;
    }
    document.getElementsByTagName('head')[0].appendChild(tag);
  }

  /**
   * Remove HTML element
   * @param {string} id Element ID
   */
  static removeElementById(id) {
    const tag = document.getElementById(id);
    if (tag) {
      tag.remove();
    }
  }

  /**
   * @param {string} html HTML representing a single element
   * @return {Node|NodeList}
   */
  static nodeFromHtml(html) {
    const template = document.createElement('template');
    template.innerHTML = html.trim();
    return template.content.childNodes.length > 1 ? template.content.childNodes : template.content.firstChild;
  }

  /**
   * @throws On invalid input
   * @param {*} input
   * @param {boolean=} isNullable
   * @return {(null|number)}
   */
  static getFloat(input, isNullable = false) {
    return uUtils.getParsed(input, isNullable, 'float');
  }

  /**
   * @throws On invalid input
   * @param {*} input
   * @param {boolean=} isNullable
   * @return {(null|number)}
   */
  static getInteger(input, isNullable = false) {
    return uUtils.getParsed(input, isNullable, 'int');
  }

  /**
   * @throws On invalid input
   * @param {*} input
   * @param {boolean=} isNullable
   * @return {(null|string)}
   */
  static getString(input, isNullable = false) {
    return uUtils.getParsed(input, isNullable, 'string');
  }

  /**
   * @throws On invalid input
   * @param {*} input
   * @param {boolean} isNullable
   * @param {string} type
   * @return {(null|number|string)}
   */
  static getParsed(input, isNullable, type) {
    if (isNullable && input === null) {
      return null;
    }
    let output;
    switch (type) {
      case 'float':
        output = parseFloat(input);
        break;
      case 'int':
        output = Math.round(parseFloat(input));
        break;
      case 'string':
        output = String(input);
        break;
      default:
        throw new Error('Unknown type');
    }
    if (typeof input === 'undefined' || input === null ||
      (type !== 'string' && isNaN(output))) {
      throw new Error('Invalid value');
    }
    return output;
  }

  /**
   * Format date to date, time and time zone strings
   * Simplify zone name, eg.
   * date: 2017-06-14, time: 11:42:19, zone: GMT+2 CEST
   * @param {Date} date
   * @return {{date: string, time: string, zone: string}}
   */
  static getTimeString(date) {
    let timeZone = '';
    const dateStr = `${date.getFullYear()}-${(`0${date.getMonth() + 1}`).slice(-2)}-${(`0${date.getDate()}`).slice(-2)}`;
    const timeStr = date.toTimeString().replace(/^\s*([^ ]+)([^(]*)(\([^)]*\))*/,
      // eslint-disable-next-line max-params
      (_, hours, zone, dst) => {
        if (zone) {
          timeZone = zone.replace(/(0(?=[1-9]00))|(00\b)/g, '');
          if (dst && (/[A-Z]/).test(dst)) {
            timeZone += dst.match(/\b[A-Z]+/g).join('');
          }
        }
        return hours;
      });
    return { date: dateStr, time: timeStr, zone: timeZone };
  }

  /**
   * @param {string} url
   */
  static openUrl(url) {
    window.location.assign(url);
  }

  /**
   * Degrees to radians
   * @param {number} degrees
   * @return {number}
   */
  static deg2rad(degrees) {
    return degrees * Math.PI / 180;
  }

  /**
   * Recursively compare properties of two objects with same keys
   * @param {Object} obj1
   * @param {Object} obj2
   * @return {boolean} True if properties are equal
   */
  static isDeepEqual(obj1, obj2) {
    return Object.keys(obj1).every((key) => {
      if (typeof obj1[key] === 'object' && obj1[key] !== null &&
        typeof obj2[key] === 'object' && obj2[key] !== null) {
        return this.isDeepEqual(obj1[key], obj2[key]);
      }
      return obj1[key] === obj2[key];
    })
  }
}
