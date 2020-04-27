import React, { useEffect, useState, useCallback, memo, cloneElement } from 'react';
import './App.css';

const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setDebouncedValue(value)
    }, delay);

    return () => clearTimeout(timeout);
  }, [value, delay]);

  return debouncedValue;
}

const mockBackend = async (fn, delay, errorRate, error) => {
  const [res] = await Promise.all([
    fn(), 
    new Promise(resolve => setTimeout(resolve, delay)),
  ]);

  if (errorRate && Math.random() < errorRate) throw error;

  return res;
}

const Typeahead = memo((props) => {
  const { options, renderItem } = props;
  const [displayedOptions, setDisplayedOptions] = useState(options);
  const [filterValue, setFilterValue] = useState(null);
  const debouncedFilterValue = useDebounce(filterValue, 500);
  const [selectedItems, setSelectedItems] = useState([]);
  const [inputFocused, setInputFocused] = useState(true);

  useEffect(() => {
    setDisplayedOptions(
      debouncedFilterValue && options.filter(({option}) => option.toLowerCase().includes(debouncedFilterValue)) ||
      options,
    );
  }, [options, debouncedFilterValue]);

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
        filterValue={debouncedFilterValue}
        selectItem={selectItem}
        renderItem={renderItem}
      />}
    </div>
  );
})

const TypeaheadSelections = memo((props) => {
  const { selectedItems, removeSelection } = props;

  const handleRemoval = useCallback((item) => () => removeSelection(item), [removeSelection]);
  return <ul className="typeahead-selections">
    {
      selectedItems.map(item => 
        <li 
          key={item} 
          onClick={handleRemoval(item)}
          className="typeahead-selection"
        >
          <span>{item}</span>
        </li>)
    }
  </ul>;
})

const TypeaheadInput = memo((props) => {
  const { filterCountries, focusInput } = props;
  const handleChange = useCallback(e => filterCountries(e.target.value), [filterCountries]);

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
  const { filterValue, options, selectItem, renderItem } = props;

  return (
    <ul>
      {options.map(({option}) => 
        <TypeaheadMenuItem 
          key={option} 
          option={option} 
          filterValue={filterValue}
          selectItem={selectItem}
          renderItem={renderItem}
        />)}
    </ul>
  );
})

const TypeaheadMenuItem = memo((props) => {
  const { option, filterValue, selectItem, renderItem } = props;

  const handleSelect = useCallback(() => selectItem(option), [selectItem, option]);

  return cloneElement(renderItem(option, split(option, filterValue)), { onClick: handleSelect });
})

function App() {
  const [ countries, setCountries ] = useState([]);
  const [ error, setError ] = useState(null);

  async function fetchCountries() {
    try {
      const json = await mockBackend(async () => {
        const resp = await fetch('https://raw.githubusercontent.com/samayo/country-json/master/src/country-by-name.json');
        return await resp.json();
      }, 1000, .1, 'MEH!');
      setCountries(json.map(({country}) => ({option: country})));
    } catch (e) {
      setError(e);
    }
  }

  useEffect(() => {
    fetchCountries();
  }, []);

  if (error) return <div>{error}</div>;

  return (
    <Typeahead
      options={countries}
      renderItem={(option, highlights) => <li key={option}>{
        highlights.map((v, i) => <span key={i} className={i%2 && 'highlight'}>{v}</span>)
      }</li>}
    />
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