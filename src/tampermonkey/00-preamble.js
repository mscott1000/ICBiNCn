// ==UserScript==
// @name         ICBiNCn 10.15
// @namespace    http://tampermonkey.net/
// @version      2026-10-15
// @description  Background Case.net scraper using JSON/XHR endpoints. Navs to search results pages, pulls case data via POST requests, then writes to a persistent log for copying. Now with Track This Case.
// @author       Mason Scott
// @match        https://www.courts.mo.gov/casenet/*
// @match        https://www.courts.mo.gov/cases/*
// @match        https://www.courts.mo.gov/cnet/*
// @match        https://www.municourt.net/*
// @match        https://www.jotform.com/tables/*
// @match        https://docs.google.com/spreadsheets/d/1TPCAM7rJ9e_YDLrgI4YfjOq_QXZFfo6Sj6c9g9qPth4/*
// @run-at       document-idle
// @grant        GM_addStyle
// @grant        GM_setClipboard
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_addValueChangeListener
// @grant        GM_removeValueChangeListener
// @grant        GM_xmlhttpRequest
// @grant        GM_openInTab
// @grant        unsafeWindow
// @connect      www.municourt.net
// ==/UserScript==

(function () {
  'use strict';
