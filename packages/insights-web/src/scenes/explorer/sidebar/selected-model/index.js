import React, { Component } from 'react'
import { kea, useActions, useValues } from 'kea'

import { Button, Tree, Icon, Tag } from 'antd'

import OldNode from './old-node'
import { columnIcon } from '../../connection/subset/form/models/edit-field'

import explorerLogic from 'scenes/explorer/logic'
import viewsLogic from 'scenes/header/views/logic'
import { useSelector } from 'react-redux'
import locationSelector from 'lib/selectors/location'
import HighlightText from 'lib/utils/highlight-text'
import FavouriteStar from './favourite-star'
import FilterButton from './filter-button'
import { getSortedMeta } from '../../../../lib/explorer/get-sorted-meta'

const { TreeNode } = Tree;

const stringIn = (search, string) => {
  let i = 0
  const s = search.toLowerCase()
  string.toLowerCase().split('').forEach(letter => {
    if (i < s.length && s[i] === letter) {
      i++
    }
  })
  return i >= s.length
}

function renderTreeNodes ({ title, path, field, localSearch, model, focusSearch, sortedStructure, treeState }) {
  const childNodes = Object.values(sortedStructure[model] || {})

  const titleComponent = field
    ? (
      <>
        {localSearch ? <HighlightText highlight={localSearch}>{title}</HighlightText> : title}
        {' '}
        {field.type === 'link' ? (
          <span className='model-link-tag'><Icon type='link' /> {field.meta.model}</span>
        ) : (
          <span className='model-field-controls'>
            <FavouriteStar path={path} />
            <FilterButton path={path} />
          </span>
        )}
      </>
    ) : <strong>{model}</strong>

  return (
    <TreeNode key={path}
              isLeaf={field && field.type !== 'link'}
              title={titleComponent}
              className={field ? `field-type-${field.type}` : ''}
              switcherIcon={field && field.type !== 'link' ? <Icon type={field.meta.index === 'primary_key' ? 'idcard' : (columnIcon[field.meta.type] || 'question-circle')} /> : null}>
      {treeState[path] && childNodes.
        filter(child => !localSearch || stringIn(localSearch.split(' ')[0], `${path}.${child.key}`)).
        map(child => {
          return renderTreeNodes({
            path: `${path}.${child.key}`,
            field: child,
            model: child.meta && child.meta.model,
            localSearch: localSearch.split(' ').slice(1).join(' '),
            title: child.key,
            focusSearch: focusSearch,
            sortedStructure,
            treeState
          })
        })}
    </TreeNode>
  )
}

export default function SelectedModel () {
  const { sortedStructure, sortedStructureObject, selectedModel, savedViews, modelFavourites, search, treeState, expandedKeys } = useValues(explorerLogic)
  const { closeModel, focusSearch, treeClicked, openUrl, closeTreeNode, openTreeNode, setExpandedKeys } = useActions(explorerLogic)

  const { openView } = useActions(viewsLogic)
  const { pathname: urlPath, search: urlSearch } = useSelector(locationSelector)

  const url = urlPath + urlSearch

  return (
    <div>
      <div>
        <Button type='link' icon='close' style={{float: 'right'}} onClick={closeModel} />
        <h4 style={{ lineHeight: '30px', fontSize: 18, fontWeight: 'bold' }}>{selectedModel}</h4>
      </div>

      <Tree
        showIcon
        switcherIcon={<Icon type="down" />}
        expandedKeys={expandedKeys}
        onExpand={setExpandedKeys}
        selectable
        selectedKeys={[]}
        onSelect={(([key]) => onTreeClick(key))}
      >
        {/*<TreeNode title={<><span>Saved views</span> <small>(0)</small></>} key="...saved">*/}
        {/*  <TreeNode title="id" switcherIcon={<Icon type='idcard' />} key="saved-1" />*/}
        {/*</TreeNode>*/}
        <TreeNode title={
          <>
            <strong><Icon type='pushpin' theme="filled" /> Pinned Fields </strong> <small>({modelFavourites.length})</small>
          </>
        } key="...pinned">
          {modelFavourites.map(path => {
            const field = getSortedMeta(path, sortedStructureObject)
            const [_, ...rest] = path.split('.')
            return renderTreeNodes({
              field,
              title: rest.join('.'),
              path: path,
              localSearch: '',
              model: field && field.meta ? field.meta.model : '',
              focusSearch,
              sortedStructure,
              treeState
            })
          })}
        </TreeNode>
        {renderTreeNodes({ title: selectedModel, path: selectedModel, localSearch: search, model: selectedModel, focusSearch, sortedStructure, treeState })}
      </Tree>

      <div className='node' style={{marginBottom: 10}}>
        <div className='node-entry'>
          <div className='node-icon has-children open' />
          <div className='node-title'>
            Saved views <small className='count-tag'>({savedViews.length})</small>
          </div>
        </div>
        <div className='node-children'>
          {savedViews.map(view => (
            <div key={view._id} className='node'>
              <div className='node-entry'>
                <div className='node-icon no-children' />
                <div
                  className='node-title'
                  onClick={() => openView(view._id)}
                  style={{ fontWeight: url === view.path ? 'bold' : 'normal' }}>
                  {view.name}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className='node' style={{marginBottom: 10}}>
        <div className='node-entry'>
          <div className='node-icon has-children open' />
          <div className='node-title'>
            Favourite fields <small className='count-tag'>({modelFavourites.length})</small>
          </div>
        </div>
        <div className='node-children'>
          {modelFavourites.map(favourite => (
            <OldNode
              key={favourite}
              path={favourite}
              localSearch=''
              connection={favourite.substring(selectedModel.length + 1)}
              focusSearch={focusSearch} />
          ))}
        </div>
      </div>

      <OldNode key={selectedModel}
               path={selectedModel}
               localSearch={search}
               model={selectedModel}
               focusSearch={focusSearch} />

    </div>
  )
}