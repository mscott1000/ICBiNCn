
  /************************************************************
   * YOB matching
   ************************************************************/
  function extractYearsFromYobText(yobText) {const t = String(yobText || '');
                                            const years = [];
                                            const yyyy = t.match(/\b(19\d{2}|20\d{2})\b/g) || [];
                                            for (const y of yyyy) years.push(y);
                                            const dates = t.match(/\b\d{2}\/\d{2}\/(19\d{2}|20\d{2})\b/g) || [];
                                            for (const d of dates) {const m = d.match(/(19\d{2}|20\d{2})/);
                                                                    if (m) years.push(m[1]);}
                                            return Array.from(new Set(years));}

  function yobMatchesExpected(expected4,scrapedText) {const exp = String(expected4 || '').trim();
                                                     if (!/^\d{4}$/.test(exp)) return {ok:true,reason:'no_expected_yob'};
                                                     const years = extractYearsFromYobText(scrapedText);
                                                     if (!years.length) return {ok:true,reason:'unknown_keep'};
                                                     const ok = years.includes(exp);
                                                     return {ok,years};}
