(() => {
  const escapeHtml = value => String(value).replace(/[&<>\"]/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[ch]));
  const tok = (cls, text) => `<span class="${cls}">${escapeHtml(text)}</span>`;
  const quoted = (s, i) => {
    const q=s[i]; let j=i+1;
    while(j<s.length){ if(s[j]==='\\'){j+=2;continue;} if(s[j]===q){j++;break;} j++; }
    return j;
  };
  const REDIS = new Set(`ACL APPEND AUTH BGSAVE BITCOUNT BITFIELD BITOP BLPOP BLMOVE BRPOP CLIENT CLUSTER COMMAND CONFIG COPY DBSIZE DECR DECRBY DEL DISCARD DUMP ECHO EVAL EVALSHA EXEC EXISTS EXPIRE EXPIREAT FCALL FCALL_RO FUNCTION GEOADD GEODIST GEOSEARCH GET GETDEL GETEX GETRANGE HDEL HEXISTS HEXPIRE HGET HGETALL HGETEX HINCRBY HINCRBYFLOAT HLEN HMGET HPEXPIRE HPTTL HPERSIST HSCAN HSET HSETEX HTTL INCR INCRBY INCRBYFLOAT INFO KEYS LASTSAVE LATENCY LINDEX LLEN LMOVE LPOP LPUSH LRANGE LREM LSET LTRIM MEMORY MGET MONITOR MSET MULTI OBJECT PERSIST PEXPIRE PEXPIREAT PFADD PFCOUNT PFMERGE PING PUBLISH PUBSUB RENAME RENAMENX REPLICAOF RESTORE ROLE RPOP RPUSH SADD SAVE SCAN SCARD SDIFF SET SETBIT SETEX SETNX SINTER SISMEMBER SLOWLOG SMEMBERS SMISMEMBER SPOP SRANDMEMBER SREM SSUBSCRIBE SUBSCRIBE SUNION TIME TTL TYPE UNLINK UNSUBSCRIBE VSIM VADD WATCH XACK XADD XAUTOCLAIM XCLAIM XGROUP XINFO XPENDING XRANGE XREAD XREADGROUP XREVRANGE XTRIM ZADD ZCARD ZCOUNT ZDIFF ZINCRBY ZINTER ZPOPMIN ZRANGE ZRANK ZREM ZREMRANGEBYSCORE ZREVRANK ZSCORE ZUNION FT.CREATE FT.SEARCH FT.AGGREGATE FT.INFO FT.PROFILE JSON.GET JSON.SET JSON.DEL JSON.NUMINCRBY JSON.ARRAPPEND JSON.MERGE TS.CREATE TS.ADD TS.RANGE TS.MRANGE TS.CREATERULE TS.INFO BF.ADD BF.RESERVE BF.EXISTS CF.ADD CF.RESERVE CF.EXISTS CMS.INCRBY CMS.QUERY TOPK.RESERVE TOPK.ADD TOPK.LIST TDIGEST.CREATE TDIGEST.ADD TDIGEST.QUANTILE`.split(/\s+/));
  const LUA = new Set('and break do else elseif end false for function goto if in local nil not or repeat return then true until while'.split(' '));
  const PS = new Set('if else elseif foreach for while switch function param return try catch finally throw class enum begin process end'.split(' '));
  const colorLine = (src, mode) => {
    let out='', i=0, firstWord=true;
    while(i<src.length){
      if((mode==='shell'||mode==='powershell'||mode==='lua'||mode==='redisconf'||mode==='acl') && src[i]==='#'){ out+=tok('token-comment',src.slice(i)); break; }
      if(mode==='lua' && src.slice(i,i+2)==='--'){ out+=tok('token-comment',src.slice(i)); break; }
      const c=src[i];
      if(/\s/.test(c)){ let j=i+1; while(j<src.length&&/\s/.test(src[j]))j++; out+=escapeHtml(src.slice(i,j)); i=j; continue; }
      if(c==='"'||c==="'"||c==='`'){ const j=quoted(src,i); out+=tok('token-string',src.slice(i,j)); i=j; continue; }
      if(/\d/.test(c)){ const m=src.slice(i).match(/^\d+(?:\.\d+)?(?:ms|s|kb|mb|gb)?/i); out+=tok('token-number',m[0]); i+=m[0].length; continue; }
      if(mode==='shell' && c==='$'){ const m=src.slice(i).match(/^\$\{?[A-Za-z_][A-Za-z0-9_]*\}?/); if(m){out+=tok('token-name',m[0]);i+=m[0].length;continue;} }
      if(mode==='powershell' && c==='$'){ const m=src.slice(i).match(/^\$[A-Za-z_][A-Za-z0-9_:.-]*/); if(m){out+=tok('token-name',m[0]);i+=m[0].length;continue;} }
      if(/[A-Za-z_@+%~&.-]/.test(c)){
        let j=i+1; while(j<src.length&&/[A-Za-z0-9_:@+%~&./*-]/.test(src[j]))j++;
        const w=src.slice(i,j), up=w.toUpperCase(); let cls='token-name';
        if(mode==='redis') cls = (REDIS.has(up)||firstWord||/^(NX|XX|EX|PX|KEEPTTL|WITHSCORES|MATCH|COUNT|TYPE|BYSCORE|BYLEX|REV|LIMIT|WEIGHTS|AGGREGATE|SUM|MIN|MAX|STREAMS|BLOCK|GROUP|NOACK|IDLE|TIME|RETRYCOUNT|FORCE|JUSTID|MKSTREAM|ENTRIESREAD|ON|PREFIX|SCHEMA|TEXT|TAG|NUMERIC|GEO|VECTOR|SORTABLE|DIALECT|LOAD|GROUPBY|REDUCE|SORTBY|FILTER|APPLY|RETURN|PARAMS|VALUES|Q8|NOQUANT|BIN|EF|TRUTH|FILTER-EF)$/i.test(w))?'token-keyword':'token-name';
        else if(mode==='lua') cls=LUA.has(w)?'token-keyword':'token-name';
        else if(mode==='powershell') cls=PS.has(w.toLowerCase())?'token-keyword':(/^-[A-Za-z]/.test(w)?'token-operator':'token-name');
        else if(mode==='shell') cls=/^(docker|redis-cli|redis-server|openssl|python|python3|export|set|echo|cat|mkdir|rm|cp|mv|grep|awk|sed|sleep|for|do|done|if|then|fi)$/i.test(w)?'token-function':'token-name';
        else if(mode==='redisconf') cls=firstWord?'token-keyword':(/^(yes|no|allkeys-|volatile-|noeviction)/i.test(w)?'token-string':'token-name');
        else if(mode==='acl') cls=/^(user|on|off|reset|resetpass|resetkeys|resetchannels|nopass)$/i.test(w)?'token-keyword':(/^[+\-%~&]/.test(w)?'token-operator':'token-name');
        else if(mode==='pseudo') cls=/^(if|else|while|for|return|retry|allow|deny|acquire|release|read|write)$/i.test(w)?'token-keyword':'token-name';
        out+=tok(cls,w); i=j; firstWord=false; continue;
      }
      if('=:+-*/<>!&|'.includes(c)) out+=tok('token-operator',c); else out+=escapeHtml(c);
      i++; firstWord=false;
    }
    return out;
  };
  const modeFor = raw => {
    const l=String(raw||'').toLowerCase().trim();
    if(l==='redis-cli') return 'redis';
    if(l==='redis.conf') return 'redisconf';
    if(l==='acl') return 'acl';
    if(l==='lua') return 'lua';
    if(l==='powershell'||l==='shell / powershell') return 'powershell';
    if(l==='pseudo-code'||l==='pseudocode') return 'pseudo';
    return null;
  };
  document.querySelectorAll('[data-code-block]').forEach(block => {
    const mode=modeFor(block.dataset.language);
    if(!mode) return;
    const code=block.querySelector('code');
    if(!code || code.dataset.syntaxHighlighted==='true' || code.querySelector('[class*="token-"]')) return;
    const lines=[...code.querySelectorAll('.code-line')];
    if(lines.length) lines.forEach(line => line.innerHTML=colorLine(line.textContent||'',mode));
    else code.innerHTML=(code.textContent||'').split('\n').map(line=>colorLine(line,mode)).join('\n');
    code.dataset.syntaxHighlighted='true';
  });
})();
