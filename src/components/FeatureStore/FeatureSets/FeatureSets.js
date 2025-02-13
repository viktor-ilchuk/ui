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
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { connect, useSelector, useDispatch } from 'react-redux'
import axios from 'axios'
import { cloneDeep } from 'lodash'

import FeatureSetsView from './FeatureSetsView'
import { FeatureStoreContext } from '../FeatureStore'

import {
  DETAILS_OVERVIEW_TAB,
  FEATURE_SETS_TAB,
  FEATURE_STORE_PAGE,
  GROUP_BY_NAME,
  GROUP_BY_NONE,
  TAG_FILTER_ALL_ITEMS,
  TAG_LATEST
} from '../../../constants'
import { featureSetsActionCreator, featureSetsFilters, generatePageData } from './featureSets.util'
import { cancelRequest } from '../../../utils/cancelRequest'
import { checkTabIsValid, handleApplyDetailsChanges } from '../featureStore.util'
import { createFeatureSetsRowData } from '../../../utils/createFeatureStoreContent'
import { getFeatureSetIdentifier } from '../../../utils/getUniqueIdentifier'
import { isDetailsTabExists } from '../../../utils/isDetailsTabExists'
import { parseFeatureSets } from '../../../utils/parseFeatureSets'
import { getFilterTagOptions, setFilters } from '../../../reducers/filtersReducer'
import { setNotification } from '../../../reducers/notificationReducer'
import { useGetTagOptions } from '../../../hooks/useGetTagOptions.hook'
import { useGroupContent } from '../../../hooks/groupContent.hook'
import { useOpenPanel } from '../../../hooks/openPanel.hook'
import { parseChipsData } from '../../../utils/convertChipsData'

import { ReactComponent as Yaml } from 'igz-controls/images/yaml.svg'

const FeatureSets = ({
  fetchFeatureSet,
  fetchFeatureSets,
  fetchFeatureSetsTags,
  removeFeatureSet,
  removeFeatureSets,
  removeFeatureStoreError,
  removeNewFeatureSet,
  updateFeatureStoreData
}) => {
  const [featureSets, setFeatureSets] = useState([])
  const [selectedFeatureSet, setSelectedFeatureSet] = useState({})
  const [selectedRowData, setSelectedRowData] = useState({})

  const openPanelByDefault = useOpenPanel()
  const [urlTagOption] = useGetTagOptions(fetchFeatureSetsTags, featureSetsFilters)
  const params = useParams()
  const featureStore = useSelector(store => store.featureStore)
  const filtersStore = useSelector(store => store.filtersStore)
  const featureStoreRef = useRef(null)
  const navigate = useNavigate()
  const location = useLocation()
  const dispatch = useDispatch()

  const detailsFormInitialValues = useMemo(
    () => ({
      description: selectedFeatureSet.description,
      labels: parseChipsData(selectedFeatureSet.labels)
    }),
    [selectedFeatureSet.description, selectedFeatureSet.labels]
  )

  const { featureSetsPanelIsOpen, setFeatureSetsPanelIsOpen, toggleConvertedYaml } =
    React.useContext(FeatureStoreContext)

  const pageData = useMemo(() => generatePageData(selectedFeatureSet), [selectedFeatureSet])

  const actionsMenu = useMemo(
    () => [
      {
        label: 'View YAML',
        icon: <Yaml />,
        onClick: toggleConvertedYaml
      }
    ],
    [toggleConvertedYaml]
  )

  const fetchData = useCallback(
    filters => {
      const config = {
        cancelToken: new axios.CancelToken(cancel => {
          featureStoreRef.current.cancel = cancel
        })
      }

      return fetchFeatureSets(params.projectName, filters, config).then(result => {
        setFeatureSets(parseFeatureSets(result))

        return result
      })
    },
    [fetchFeatureSets, params.projectName]
  )

  const handleRefresh = filters => {
    dispatch(getFilterTagOptions({ fetchTags: fetchFeatureSetsTags, project: params.projectName }))

    return fetchData(filters)
  }

  const handleRemoveFeatureSet = useCallback(
    featureSet => {
      const newStoreSelectedRowData = {
        ...featureStore.featureSets.selectedRowData.content
      }

      const newPageDataSelectedRowData = { ...selectedRowData }

      delete newStoreSelectedRowData[featureSet.data.ui.identifier]
      delete newPageDataSelectedRowData[featureSet.data.ui.identifier]

      removeFeatureSet(newStoreSelectedRowData)
      setSelectedRowData(newPageDataSelectedRowData)
    },
    [featureStore.featureSets.selectedRowData.content, selectedRowData, removeFeatureSet]
  )

  const handleRequestOnExpand = useCallback(
    item => {
      const featureSetIdentifier = getFeatureSetIdentifier(item)

      setSelectedRowData(state => ({
        ...state,
        [featureSetIdentifier]: {
          loading: true
        }
      }))

      fetchFeatureSet(item.project, item.name, filtersStore.tag)
        .then(result => {
          const content = [...parseFeatureSets(result)].map(contentItem =>
            createFeatureSetsRowData(contentItem, FEATURE_SETS_TAB, params.projectName, true)
          )
          setSelectedRowData(state => ({
            ...state,
            [featureSetIdentifier]: {
              content,
              error: null,
              loading: false
            }
          }))
        })
        .catch(error => {
          setSelectedRowData(state => ({
            ...state,
            [featureSetIdentifier]: {
              ...state.selectedRowData[featureSetIdentifier],
              error,
              loading: false
            }
          }))
        })
    },
    [fetchFeatureSet, filtersStore.tag, params.projectName]
  )

  const { latestItems, handleExpandRow } = useGroupContent(
    featureSets,
    getFeatureSetIdentifier,
    handleRemoveFeatureSet,
    handleRequestOnExpand,
    null,
    FEATURE_STORE_PAGE,
    FEATURE_SETS_TAB
  )

  const tableContent = useMemo(() => {
    return filtersStore.groupBy === GROUP_BY_NAME
      ? latestItems.map(contentItem => {
          return createFeatureSetsRowData(contentItem, FEATURE_SETS_TAB, params.projectName, true)
        })
      : featureSets.map(contentItem =>
          createFeatureSetsRowData(contentItem, FEATURE_SETS_TAB, params.projectName)
        )
  }, [featureSets, filtersStore.groupBy, latestItems, params.projectName])

  const handleSelectFeatureSet = item => {
    if (params.name === item.name && params.tag === item.tag) {
      setSelectedFeatureSet(item)
    }
  }

  const applyDetailsChanges = useCallback(
    changes => {
      return handleApplyDetailsChanges(
        changes,
        fetchData,
        params.projectName,
        params.name,
        FEATURE_SETS_TAB,
        selectedFeatureSet,
        setNotification,
        updateFeatureStoreData,
        filtersStore,
        dispatch
      )
    },
    [
      dispatch,
      fetchData,
      filtersStore,
      params.name,
      params.projectName,
      selectedFeatureSet,
      updateFeatureStoreData
    ]
  )

  const applyDetailsChangesCallback = (changes, selectedItem) => {
    if (!selectedItem.tag) {
      navigate(
        `/projects/${params.projectName}/${FEATURE_STORE_PAGE}/${FEATURE_SETS_TAB}/${selectedItem.name}/${TAG_LATEST}/${DETAILS_OVERVIEW_TAB}`
      )
    }
  }

  const createFeatureSetSuccess = tag => {
    const currentTag = filtersStore.tag === TAG_FILTER_ALL_ITEMS ? TAG_FILTER_ALL_ITEMS : tag

    setFeatureSetsPanelIsOpen(false)
    removeNewFeatureSet()
    dispatch(
      setFilters({
        name: '',
        labels: '',
        tag: currentTag
      })
    )

    return handleRefresh({
      project: params.projectName,
      tag: currentTag
    })
  }

  const closePanel = () => {
    setFeatureSetsPanelIsOpen(false)
    removeNewFeatureSet()

    if (featureStore.error) {
      removeFeatureStoreError()
    }
  }

  useEffect(() => {
    setSelectedRowData({})
  }, [filtersStore.tag])

  useEffect(() => {
    if (urlTagOption) {
      fetchData({
        tag: urlTagOption,
        iter: ''
      })
    }
  }, [fetchData, urlTagOption])

  useEffect(() => {
    if (filtersStore.tag === TAG_FILTER_ALL_ITEMS) {
      dispatch(setFilters({ groupBy: GROUP_BY_NAME }))
    } else if (filtersStore.groupBy === GROUP_BY_NAME) {
      dispatch(setFilters({ groupBy: GROUP_BY_NONE }))
    }
  }, [filtersStore.groupBy, filtersStore.tag, dispatch])

  useEffect(() => {
    const content = cloneDeep(featureStore.featureSets?.allData)

    if (params.name && content.length !== 0) {
      const selectedItem = content.find(contentItem => {
        return (
          contentItem.name === params.name &&
          (contentItem.tag === params.tag || contentItem.uid === params.tag)
        )
      })

      if (!selectedItem) {
        navigate(`/projects/${params.projectName}/feature-store/${FEATURE_SETS_TAB}`, {
          replace: true
        })
      } else {
        setSelectedFeatureSet(selectedItem)
      }
    } else {
      setSelectedFeatureSet({})
    }
  }, [featureStore.featureSets.allData, navigate, params.name, params.projectName, params.tag])

  useEffect(() => {
    if (params.name && params.tag && pageData.details.menu.length > 0) {
      isDetailsTabExists(params.tab, pageData.details.menu, navigate, location)
    }
  }, [navigate, location, pageData.details.menu, params.name, params.tag, params.tab])

  useEffect(() => {
    checkTabIsValid(navigate, params, selectedFeatureSet, FEATURE_SETS_TAB)
  }, [navigate, params, selectedFeatureSet])

  useEffect(() => {
    if (openPanelByDefault) {
      setFeatureSetsPanelIsOpen(true)
    }
  }, [openPanelByDefault, setFeatureSetsPanelIsOpen])

  useEffect(() => {
    return () => {
      setFeatureSets([])
      removeFeatureSets()
      removeFeatureSet()
      setSelectedFeatureSet({})
      setSelectedRowData({})
      cancelRequest(featureStoreRef, 'cancel')
    }
  }, [removeFeatureSet, removeFeatureSets, params.projectName])

  return (
    <FeatureSetsView
      actionsMenu={actionsMenu}
      applyDetailsChanges={applyDetailsChanges}
      applyDetailsChangesCallback={applyDetailsChangesCallback}
      closePanel={closePanel}
      createFeatureSetSuccess={createFeatureSetSuccess}
      detailsFormInitialValues={detailsFormInitialValues}
      featureSets={featureSets}
      featureSetsPanelIsOpen={featureSetsPanelIsOpen}
      featureStore={featureStore}
      filtersStore={filtersStore}
      handleExpandRow={handleExpandRow}
      handleRefresh={handleRefresh}
      pageData={pageData}
      ref={featureStoreRef}
      selectedFeatureSet={selectedFeatureSet}
      selectedRowData={selectedRowData}
      setSelectedFeatureSet={handleSelectFeatureSet}
      tableContent={tableContent}
    />
  )
}

export default connect(null, {
  ...featureSetsActionCreator
})(FeatureSets)
