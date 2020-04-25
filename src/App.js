import React, { useEffect, useState, useCallback, memo } from 'react';
import './App.css';

const Typeahead = memo((props) => {
  const { options } = props;
  const [displayedOptions, setDisplayedOptions] = useState(options);
  const [filterValue, setFilterValue] = useState(null);
  const [selectedItems, setSelectedItems] = useState([]);
  const [inputFocused, setInputFocused] = useState(false);

  useEffect(() => {
    setDisplayedOptions(
      filterValue && options.filter(({option}) => option.toLowerCase().includes(filterValue)) ||
      options,
    );
  }, [options, filterValue]);

  const filterCountries = useCallback((value) => {
    setFilterValue(value.toLowerCase());
  }, [setFilterValue]);

  const selectItem = useCallback((option) => {
    setSelectedItems([...new Set([...selectedItems, option])]);
  }, [selectedItems, setSelectedItems]);

  const removeSelection = useCallback(option => {
    setSelectedItems(selectedItems.reduce((acc, cur) => {
      if (cur === option) return acc;
      acc.push(cur);

      return acc;
    }, []));
  }, [selectedItems, setSelectedItems]);

  const focusInput = useCallback((focused) => {
    setInputFocused(focused);
  }, [setInputFocused]);

  return (
    <div>
      <TypeaheadSelections selectedItems={selectedItems} removeSelection={removeSelection} />
      <TypeaheadInput filterCountries={filterCountries} focusInput={focusInput} />
      {inputFocused && <TypeaheadMenu 
        options={displayedOptions} 
        filterValue={filterValue}
        selectItem={selectItem} 
      />}
    </div>
  );
})

const TypeaheadSelections = memo((props) => {
  const { selectedItems, removeSelection } = props;

  const handleRemoval = useCallback((item) => () => removeSelection(item), [removeSelection]);
  return <ul className="typeahead-selections">{
    selectedItems.map(item => 
      <li 
        key={item} 
        onClick={handleRemoval(item)}
        className="typeahead-selection"
        >
          <span>{item}</span>
      </li>)
  }</ul>;
})

const TypeaheadInput = memo((props) => {
  const { filterCountries, focusInput } = props;
  const handleChange = useCallback(e => filterCountries(e.target.value), []);

  const handleFocus = useCallback(focused => () => focusInput(focused), [focusInput]);

  return (
    <input 
      type="text" 
      placeholder="Search for country" 
      onChange={handleChange} 
      onFocus={handleFocus(true)} 
    />
  )
})

const TypeaheadMenu = memo((props) => {
  const { filterValue, options, selectItem } = props;

  return (
    <ul>
      {options.map(({option}) => 
        <TypeaheadMenuItem 
          key={option} 
          option={option} 
          filterValue={filterValue}
          selectItem={selectItem}
        />)}
    </ul>
  );
})

const TypeaheadMenuItem = memo((props) => {
  const { option, filterValue, selectItem } = props;

  const handleSelect = useCallback(() => selectItem(option), [selectItem]);

  return <li key={option} onClick={handleSelect}>{
    split(option, filterValue).map((v, i) => <span key={i} className={i%2 && 'highlight'}>{v}</span>)
  }</li>;
})

function App() {
  const [ countries, setCountries ] = useState([]);

  async function fetchCountries() {
    const resp = await fetch('https://raw.githubusercontent.com/samayo/country-json/master/src/country-by-name.json');

    const json = await resp.json();
    setCountries(json.map(({country}) => ({option: country})));
  }

  useEffect(() => {
    fetchCountries();
  }, []);

  return (
    <Typeahead options={countries} />
  );
}

export default App;

function split(string, pattern) {
  if (!pattern) return [string];

  let rest = string;
  let index = rest.toLowerCase().indexOf(pattern.toLowerCase());
  const result = [];
  while (index !== -1) {
    result.push(rest.slice(0, index), rest.slice(index, index + pattern.length));
    rest = rest.slice(index + pattern.length);
    index = rest.toLowerCase().indexOf(pattern.toLowerCase());
  }

  result.push(rest);

  return result;
}