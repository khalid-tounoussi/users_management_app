import React, { useEffect, useCallback, useMemo, useState } from 'react';
import MaterialReactTable from 'material-react-table';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  MenuItem,
  Stack,
  TextField,
  Tooltip,
} from '@mui/material';
import { Delete, Edit, South } from '@mui/icons-material';

const IP_ADRESS = "http://localhost:8989";

const Example = () => {
  //data and fetching state
  const [data, setData] = useState([]);
  const [isError, setIsError] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefetching, setIsRefetching] = useState(false);
  const [rowCount, setRowCount] = useState(0);

  //table state
  const [columnFilters, setColumnFilters] = useState([]);
  const [globalFilter, setGlobalFilter] = useState('');
  const [sorting, setSorting] = useState([]);
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10,
  });

  //if you want to avoid useEffect, look at the React Query example instead
  useEffect(() => {
    console.log("USE EFFECT IS called");
    const fetchData = async () => {
      if (!data.length) {
        setIsLoading(true);
      } else {
        setIsRefetching(true);
      }

      const url = new URL(
        '/users?size=1000',
        process.env.NODE_ENV === 'production'
          ? 'https://www.material-react-table.com'
          : IP_ADRESS,
      );

      try {
        console.log(url.href)
        const response = await fetch(url.href);
        const json = await response.json();
        console.log(json._embedded.users);
        setData(json._embedded.users);
        setRowCount(json.page.size);
      } catch (error) {
        setIsError(true);
        console.error(error);
        return;
      }
      setIsError(false);
      setIsLoading(false);
      setIsRefetching(false);
    };
    fetchData();
  }, [data.length]);


  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [tableData, setTableData] = useState(() => data);
  const [validationErrors, setValidationErrors] = useState({});

  const handleCreateNewRow = (values) => {
    console.log("THIS IS CALLED");
    console.log(values);
    tableData.push(values);
    data.push(values);
    setTableData(tableData);
    setData(data);
    setTableData([...tableData]);
    console.log(tableData);
    console.log(data);

  };

  const handleSaveRowEdits = async ({ exitEditingMode, row, values }) => {
    if (!Object.keys(validationErrors).length) {
      console.log(row)
      tableData[row.index] = values;

      const requestOptions = {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values)
      };
      await fetch(IP_ADRESS, '/users/' + row.original.id, requestOptions)
        .then(response => response.json())
        .then(data => {
          tableData[row.index] = values;
          setData(data)
          setTableData(tableData);
        });

      //send/receive api updates here, then refrech or update local table data for re-render
      setTableData([...tableData]);
      exitEditingMode(); //required to exit editing mode and close modal
    }
  };

  const handleCancelRowEdits = () => {
    setValidationErrors({});
  };

  const handleDeleteRow = useCallback(
    (row) => {
      console.log(row.original);
      const fetchData = async () => {
        if (!data.length) {
          setIsLoading(true);
        } else {
          setIsRefetching(true);
        }

        const url = new URL(
          '/users',
          process.env.NODE_ENV === 'production'
            ? 'https://www.material-react-table.com'
            : IP_ADRESS,
        );

        try {
          console.log(url.href);
          const response = await fetch(url.href);
          const json = await response.json();
          console.log(json._embedded.users);
          setData(json._embedded.users);
          setRowCount(json.page.size);
        } catch (error) {
          setIsError(true);
          console.error(error);
          return;
        }
        setIsError(false);
        setIsLoading(false);
        setIsRefetching(false);
      };

      if (
        !window.confirm(`Are you sure you want to delete ${row.getValue('first_name')}`)
      ) {
        return;
      }
      //send api delete request here, then refetch or update local table data for re-render
      fetch('http://localhost:8090/users/' + row.original.id, { method: 'DELETE' }).then((resp) => {
        fetchData();

      });

      tableData.splice(row.index, 1);
      setTableData([...tableData]);
    },
    [tableData],
  );

  const getCommonEditTextFieldProps = useCallback(
    (cell) => {
      return {
        error: !!validationErrors[cell.id],
        helperText: validationErrors[cell.id],
        onBlur: (event) => {
          const isValid =
            cell.column.id === 'age'
              ? validateAge(+event.target.value)
              : validateRequired(event.target.value);
          if (!isValid) {
            //set validation error for cell if invalid
            setValidationErrors({
              ...validationErrors,
              [cell.id]: `${cell.column.columnDef.header} is required`,
            });
          } else {
            //remove validation error for cell if valid
            delete validationErrors[cell.id];
            setValidationErrors({
              ...validationErrors,
            });
          }
        },
      };
    },
    [validationErrors],
  );

  const columns = useMemo(
    () => [
      {
        accessorKey: 'first_name',
        header: 'First Name',
      },
      //column definitions...
      {
        accessorKey: 'last_name',
        header: 'Last Name',
      },
      {
        accessorKey: 'birthdate',
        header: 'Birthdate',
      },
      {
        accessorKey: 'city',
        header: 'City',
      },
      //end
    ],
    [],
  );
  return (
    <>
      <MaterialReactTable
        displayColumnDefOptions={{
          'mrt-row-actions': {
            muiTableHeadCellProps: {
              align: 'center',
            },
            size: 120,
          },
        }}
        columns={columns}
        data={data}
        editingMode="modal" //default
        enableColumnOrdering
        enableEditing
        onEditingRowSave={handleSaveRowEdits}
        onEditingRowCancel={handleCancelRowEdits}
        renderRowActions={({ row, table }) => (
          <Box sx={{ display: 'flex', gap: '1rem' }}>
            <Tooltip arrow placement="left" title="Edit">
              <IconButton onClick={() => table.setEditingRow(row)}>
                <Edit />
              </IconButton>
            </Tooltip>
            <Tooltip arrow placement="right" title="Delete">
              <IconButton color="error" onClick={() => handleDeleteRow(row)}>
                <Delete />
              </IconButton>
            </Tooltip>
          </Box>
        )}
        renderTopToolbarCustomActions={() => (
          <Button
            color="secondary"
            onClick={() => setCreateModalOpen(true)}
            variant="contained"
          >
            Create New User
          </Button>
        )}
      />
      <CreateNewAccountModal
        columns={columns}
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onSubmit={handleCreateNewRow}
      />
    </>
  );
};

//example of creating a mui dialog modal for creating new rows
export const CreateNewAccountModal = ({ open, columns, onClose, onSubmit }) => {
  const [values, setValues] = useState(() =>
    columns.reduce((acc, column) => {
      acc[column.accessorKey ?? ''] = '';
      return acc;
    }, {}),
  );

  const handleSubmit = async () => {
    const requestOptions = {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(values)
    };
    await fetch(IP_ADRESS, '/users', requestOptions)
      .then(function (response) {
        return response.json();
      })
      .then(function (data) {
        console.log(data)
        onSubmit(data);
        onClose();
      })


  };

  return (
    <Dialog open={open}>
      <DialogTitle textAlign="center">Create New User</DialogTitle>
      <DialogContent>
        <form onSubmit={(e) => e.preventDefault()}>
          <Stack
            sx={{
              width: '100%',
              minWidth: { xs: '300px', sm: '360px', md: '400px' },
              gap: '1.5rem',
            }}
          >
            {columns.map((column) => (
              <TextField
                key={column.accessorKey}
                label={column.header}
                name={column.accessorKey}
                onChange={(e) =>
                  setValues({ ...values, [e.target.name]: e.target.value })
                }
              />
            ))}
          </Stack>
        </form>
      </DialogContent>
      <DialogActions sx={{ p: '1.25rem' }}>
        <Button onClick={onClose}>Cancel</Button>
        <Button color="secondary" onClick={handleSubmit} variant="contained">
          Create New User
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default Example;
const validateAge = (age) => age >= 18 && age <= 50;
const validateRequired = (value) => !!value.length;