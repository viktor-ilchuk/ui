/*
Copyright 2019 Iguazio Systems Ltd.

Licensed under the Apache License, Version 2.0 (the "License") with
an addition restriction as set forth herein. You may not use this
file except in compliance with the License. You may obtain a copy of
the License at http://www.apache.org/licenses/LICENSE-2.0.

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or
implied. See the License for the specific language governing
permissions and limitations under the License.

In addition, you may not use the software for any purposes that are
illegal under applicable law, and the grant of the foregoing license
under the Apache 2.0 license is conditioned upon your compliance with
such restriction.
*/
import React, { useRef } from 'react'
import PropTypes from 'prop-types'
import classnames from 'classnames'
import { useParams } from 'react-router-dom'
import { isEmpty } from 'lodash'

import TableCell from '../TableCell/TableCell'
import ActionsMenu from '../../common/ActionsMenu/ActionsMenu'
import ErrorMessage from '../../common/ErrorMessage/ErrorMessage'

import { DETAILS_OVERVIEW_TAB, MODEL_ENDPOINTS_TAB } from '../../constants'
import { ACTIONS_MENU } from '../../types'
import { getArtifactIdentifier } from '../../utils/getUniqueIdentifier'
import { generateTableRowTestId } from '../../utils/generateTableRowTestId'

const ArtifactsTableRow = ({
  actionsMenu,
  handleExpandRow,
  handleSelectItem,
  hideActionsMenu,
  rowIndex,
  mainRowItemsCount,
  rowItem,
  selectedItem,
  selectedRowData
}) => {
  const parent = useRef()
  const params = useParams()
  const rowClassNames = classnames(
    'table-row',
    'parent-row',
    (selectedItem.db_key || selectedItem?.spec?.model) &&
      getArtifactIdentifier(selectedItem, true) === rowItem.data.ui.identifierUnique &&
      !parent.current?.classList.value.includes('parent-row-expanded') &&
      'row_active',
    parent.current?.classList.value.includes('parent-row-expanded') && 'parent-row-expanded'
  )

  return (
    <tr className={rowClassNames} ref={parent}>
      {parent.current?.classList.contains('parent-row-expanded') ? (
        <>
          <td
            data-testid={generateTableRowTestId(rowIndex)}
            className={`table-body__cell
              ${parent.current?.classList.contains('parent-row-expanded') && 'row_grouped-by'}`}
          >
            <table cellPadding="0" cellSpacing="0" className="table">
              <tbody className="table-body">
                <tr className="table-row">
                  {rowItem.content.map((data, index) => {
                    return index < mainRowItemsCount ? (
                      <TableCell
                        data={data}
                        firstCell={index === 0}
                        handleExpandRow={handleExpandRow}
                        item={rowItem}
                        key={data.id}
                        link={
                          data.rowExpanded?.getLink
                            ? data.rowExpanded.getLink(params.tab ?? DETAILS_OVERVIEW_TAB)
                            : ''
                        }
                        selectItem={handleSelectItem}
                        selectedItem={selectedItem}
                        showExpandButton
                      />
                    ) : null
                  })}
                </tr>
              </tbody>
            </table>
          </td>
          {selectedRowData[rowItem.data.ui.identifier]?.error ? (
            <td className="table-body__cell">
              <ErrorMessage message={selectedRowData[rowItem.data.ui.identifier]?.error?.message} />
            </td>
          ) : (
            selectedRowData[rowItem.data.ui.identifier]?.content.map((tableContentItem, index) => {
              const subRowClassNames = classnames(
                'table-row',
                selectedItem.key &&
                  tableContentItem.data.ui.identifierUnique ===
                    getArtifactIdentifier(selectedItem, true) &&
                  'row_active'
              )

              return (
                <td data-testid={generateTableRowTestId(rowIndex, index)} className="table-body__cell" key={index}>
                  <table cellPadding="0" cellSpacing="0" className="table">
                    <tbody className="table-body">
                      <tr className={subRowClassNames}>
                        {
                          <>
                            {tableContentItem.content.map((value, index) => {
                              const cellClassNames = classnames(
                                !isEmpty(selectedItem) &&
                                  index >= mainRowItemsCount &&
                                  'table-body__cell_hidden'
                              )

                              return (
                                !value.hidden && (
                                  <TableCell
                                    className={cellClassNames}
                                    data={
                                      value.expandedCellContent ? value.expandedCellContent : value
                                    }
                                    item={tableContentItem.data}
                                    link={value.getLink?.(params.tab ?? DETAILS_OVERVIEW_TAB)}
                                    key={value.id}
                                    selectItem={handleSelectItem}
                                    selectedItem={selectedItem}
                                  />
                                )
                              )
                            })}
                            {!hideActionsMenu && (
                              <td className="table-body__cell table-cell-icon">
                                <ActionsMenu dataItem={tableContentItem.data} menu={actionsMenu} />
                              </td>
                            )}
                          </>
                        }
                      </tr>
                    </tbody>
                  </table>
                </td>
              )
            })
          )}
        </>
      ) : (
        <>
          {rowItem.content.map((value, index) => {
            const cellClassNames = classnames(
              !isEmpty(selectedItem) && index >= mainRowItemsCount && 'table-body__cell_hidden'
            )

            return (
              !value.hidden && (
                <TableCell
                  className={cellClassNames}
                  data={value}
                  handleExpandRow={handleExpandRow}
                  firstCell={index === 0 && params.pageTab !== MODEL_ENDPOINTS_TAB}
                  item={rowItem.data}
                  key={value.id}
                  link={value.getLink?.(params.tab ?? DETAILS_OVERVIEW_TAB)}
                  selectedItem={selectedItem}
                  selectItem={handleSelectItem}
                  showExpandButton={value.showExpandButton}
                />
              )
            )
          })}
          {!hideActionsMenu && (
            <td className="table-body__cell table-cell-icon">
              <ActionsMenu dataItem={rowItem.data} menu={actionsMenu} />
            </td>
          )}
        </>
      )}
    </tr>
  )
}

ArtifactsTableRow.defaultProps = {
  handleExpandRow: null,
  handleSelectItem: () => {},
  hideActionsMenu: false,
  tableContent: null,
  mainRowItemsCount: 1
}

ArtifactsTableRow.propTypes = {
  actionsMenu: ACTIONS_MENU.isRequired,
  handleExpandRow: PropTypes.func,
  handleSelectItem: PropTypes.func,
  mainRowItemsCount: PropTypes.number,
  rowIndex: PropTypes.number.isRequired,
  rowItem: PropTypes.shape({}).isRequired,
  selectedItem: PropTypes.shape({}).isRequired,
  tableContent: PropTypes.arrayOf(PropTypes.shape({}))
}

export default React.memo(ArtifactsTableRow)
