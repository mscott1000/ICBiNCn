
  /************************************************************
   * Concurrency runner
   ************************************************************/
  async function runPool(items,workerCount,workerFn) {let idx = 0;
                                                     const results = [];
                                                     const errors = [];
                                                     async function worker(workerId) {while (true) {if (isStop()) return;
                                                                                                    const my = idx++;
                                                                                                    if (my >= items.length) return;
                                                                                                    const item = items[my];
                                                                                                    try {dbg('case_start',{workerId,caseKey: item.caseKey});
                                                                                                         const out = await workerFn(item,my);
                                                                                                         results.push(out);
                                                                                                         dbg('case_done',{workerId,caseKey: item.caseKey});}
                                                                                                    catch (e) {errors.push({caseKey: item?.caseKey,msg: String(e?.message || e)});
                                                                                                               dbg('case_error',{workerId,
                                                                                                                                caseKey: item?.caseKey,
                                                                                                                                msg: String(e?.message || e),
                                                                                                                                status: e?.status || '',
                                                                                                                                path: e?.path || '',
                                                                                                                                respUrl: e?.respUrl || '',
                                                                                                                                redirected: e?.redirected === true ? true : false,
                                                                                                                                htmlTitle: e?.htmlTitle || '',
                                                                                                                                htmlSig: e?.htmlSig || null,});}}}
                                                     const workers = [];
                                                     for (let i = 0;i < Math.max(1,workerCount);i++) workers.push(worker(i));
                                                     await Promise.all(workers);
                                                     return {results,errors};}
