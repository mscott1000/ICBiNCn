// ==UserScript==
// @name         ICBiNCn 6.16
// @namespace    http://tampermonkey.net/
// @version      2026-06-16
// @description  Background Case.net scraper using JSON/XHR endpoints. Navs to search results pages, pulls case data via POST requests, then writes to a persistent log for copying. Now with Track This Case.
// @author       Mason Scott
// @match        https://www.courts.mo.gov/casenet/*
// @match        https://www.courts.mo.gov/cases/*
// @match        https://www.courts.mo.gov/cnet/*
// @match        https://www.municourt.net/*
// @run-at       document-idle
// @grant        GM_addStyle
// @grant        GM_setClipboard
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_xmlhttpRequest
// @grant        unsafeWindow
// @connect      www.municourt.net
// ==/UserScript==

(function () {
  'use strict';
