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

export const parameterTypeStr = 'str'
export const parameterTypeInt = 'int'
export const parameterTypeFloat = 'float'
export const parameterTypeBool = 'bool'
export const parameterTypeList = 'list'
export const parameterTypeMap = 'map'

export const parameterOptionRange = 'range'
export const parameterOptionRandomize = 'randomize'
export const parameterOptionMultiple = 'multiple'
export const parameterOptionLogarithmicScale = 'logarithmicScale'

export const parameterTypeValueMap = {
  [parameterTypeStr]: 'string',
  [parameterTypeInt]: 'integer',
  [parameterTypeFloat]: 'float',
  [parameterTypeBool]: 'boolean',
  [parameterTypeMap]: 'map',
  [parameterTypeList]: 'list'
}

export const parametersValueOptionsList = [
  {
    label: 'Range',
    id: parameterOptionRange
  },
  { label: 'Randomize', id: parameterOptionRandomize },
  { label: 'Multiple', id: parameterOptionMultiple },
  { label: 'LogarithmicScale', id: parameterOptionLogarithmicScale }
]
export const parametersValueTypeOptions = [
  {
    label: 'str',
    id: parameterTypeStr
  },
  {
    label: 'int',
    id: parameterTypeInt
  },
  {
    label: 'float',
    id: parameterTypeFloat
  },
  {
    label: 'bool',
    id: parameterTypeBool
  },
  {
    label: 'list',
    id: parameterTypeList
  },
  {
    label: 'map',
    id: parameterTypeMap
  }
]
