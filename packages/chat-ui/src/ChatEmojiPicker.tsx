'use client';

import React, { forwardRef, useEffect, useLayoutEffect, useMemo, useRef, useState, type HTMLAttributes } from 'react';
import { Input, type InputRef } from 'antd';
import VirtualList from '@rc-component/virtual-list';
import { LuApple, LuCar, LuDog, LuFlag, LuLightbulb, LuSearch, LuSmile } from 'react-icons/lu';
import { TbBallFootball, TbOmega } from 'react-icons/tb';
import type { IconType } from 'react-icons';
import { SolnSpin } from './SolnSpin';
import { loadEmojiCatalog, searchEmojiCatalog, type CatalogEmoji } from './emoji-catalog';

const CATEGORIES: Array<{key:string;groups:number[];icon:IconType}> = [
  {key:'smileys',groups:[0,1,2],icon:LuSmile}, {key:'animals',groups:[3],icon:LuDog},
  {key:'food',groups:[4],icon:LuApple}, {key:'activities',groups:[6],icon:TbBallFootball},
  {key:'travel',groups:[5],icon:LuCar}, {key:'objects',groups:[7],icon:LuLightbulb},
  {key:'symbols',groups:[8],icon:TbOmega}, {key:'flags',groups:[9],icon:LuFlag},
];
const COLUMNS=8;
const GRID_HEIGHT=280;
const EmojiScrollHolder = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  function EmojiScrollHolder({className,style,...props},ref) {
    return <div {...props} ref={ref} className={`${className ?? ''} cp-sidebar-scrollbar`}
      style={{...style,overflowY:'auto',overscrollBehavior:'contain'}}/>;
  },
);

export type ChatEmojiPickerCopy = {
  search: string; label: string; loading: string; loadFailed: string; retry: string; empty: string;
  categoriesLabel: string; categories: Record<string, string>;
  select: (emoji: string, selected: boolean) => string;
};

export function ChatEmojiPicker({selected,disabled,onSelect,mobile=false,locale,copy}:{
  selected:string|null;disabled:boolean;onSelect:(emoji:string)=>void;mobile?:boolean;
  locale:string;copy:ChatEmojiPickerCopy;
}) {
  const [query,setQuery]=useState('');
  const [category,setCategory]=useState(CATEGORIES[0]);
  const [catalog,setCatalog]=useState<CatalogEmoji[]|null>(null);
  const [loadFailed,setLoadFailed]=useState(false);
  const [loadAttempt,setLoadAttempt]=useState(0);
  const searchRef=useRef<InputRef>(null);
  const gridRef=useRef<HTMLDivElement>(null);
  const [gridHeight,setGridHeight]=useState(GRID_HEIGHT);
  useEffect(()=>{
    if(!mobile)searchRef.current?.focus({preventScroll:true});
  },[mobile]);
  useLayoutEffect(()=>{
    const grid=gridRef.current;
    if(!grid)return;
    const update=()=>{if(grid.clientHeight>0)setGridHeight(grid.clientHeight);};
    update();
    const observer=new ResizeObserver(update);
    observer.observe(grid);
    return ()=>observer.disconnect();
  },[]);
  useEffect(()=>{
    let active=true;
    setCatalog(null);setLoadFailed(false);
    void loadEmojiCatalog(locale).then(data=>{if(active)setCatalog(data);})
      .catch(()=>{if(active)setLoadFailed(true);});
    return ()=>{active=false;};
  },[locale,loadAttempt]);
  const choices=useMemo(()=>searchEmojiCatalog(catalog??[],query).filter(emoji=>
    Boolean(query.trim())||category.groups.includes(emoji.group??-1)),[catalog,query,category]);
  const rows=useMemo(()=>Array.from({length:Math.ceil(choices.length/COLUMNS)},(_,index)=>choices.slice(index*COLUMNS,index*COLUMNS+COLUMNS)),[choices]);
  const emojiButton=(emoji:string,label?:string)=><button className="tenant-chat-reaction-menu__emoji" key={emoji} title={label} type="button" disabled={disabled} aria-pressed={selected===emoji}
    aria-label={copy.select(emoji, selected===emoji)}
    onClick={event=>{event.stopPropagation();onSelect(emoji);}}><span className="tenant-chat-reaction-menu__emoji-glyph">{emoji}</span></button>;
  return <div className="tenant-chat-reaction-menu__panel" >
      <div className="tenant-chat-reaction-menu__search" onPointerDown={event=>{
        if((event.target as Element).closest('input,button,[role="button"],.ant-input-clear-icon'))return;
        event.preventDefault();
        searchRef.current?.focus({preventScroll:true});
      }}>
        <Input ref={searchRef} allowClear prefix={<LuSearch size={16}/>} value={query} maxLength={128}
          onChange={event=>setQuery(event.target.value)} aria-label={copy.search}
          placeholder={copy.search}/>
      </div>
      <div ref={gridRef} className="tenant-chat-reaction-menu__grid" role="group" aria-label={copy.label}>
        {loadFailed?<div className="tenant-chat-reaction-menu__empty" role="alert">
          {copy.loadFailed}
          <button className="tenant-chat-reaction-menu__retry" type="button" onClick={()=>setLoadAttempt(value=>value+1)}>{copy.retry}</button>
        </div>:catalog===null?<div className="tenant-chat-reaction-menu__loading" role="status" aria-label={copy.loading}>
          <SolnSpin size={22}/>
        </div>:rows.length?<VirtualList key={`${category.key}:${query}`} data={rows} height={gridHeight} itemHeight={36} itemKey={row=>row[0].unicode}
          component={EmojiScrollHolder} showScrollBar={false}>
          {row=><div className="tenant-chat-reaction-menu__row">{row.map(emoji=>emojiButton(emoji.unicode,emoji.label))}</div>}
        </VirtualList>:<div className="tenant-chat-reaction-menu__empty">{copy.empty}</div>}
      </div>
      <div className="tenant-chat-reaction-menu__categories" role="group" aria-label={copy.categoriesLabel}>
        {CATEGORIES.map(item=><button key={item.key} type="button" title={copy.categories[item.key]}
          aria-label={copy.categories[item.key]} aria-pressed={category.key===item.key&&!query.trim()}
          onClick={()=>{setCategory(item);setQuery('');}}><item.icon size={17}/></button>)}
      </div>
  </div>;
}

