import React, { useState } from 'react';
import { 
    Table, 
    TableBody, 
    TableContainer, 
    TableHead, 
    TablePagination,
    Box,
    Typography,
    useTheme,
    useMediaQuery,
    Card,
    CardContent,
    Divider,
    Chip
} from '@mui/material';
import { StyledTableCell, StyledTableRow } from './styles';

const TableTemplate = ({ buttonHaver: ButtonHaver, columns, rows }) => {
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(5);
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

    const handleChangePage = (event, newPage) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    // Card View for All Devices
    const MobileCardView = () => (
        <Box sx={{ px: { xs: 1, sm: 2, md: 3 }, py: { xs: 1, sm: 2 } }}>
            {rows
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((row) => (
                    <Card 
                        key={row.id}
                        sx={{
                            mb: { xs: 1.5, sm: 2 },
                            borderRadius: { xs: 2, sm: 3 },
                            boxShadow: '0 1px 8px rgba(0, 0, 0, 0.08)',
                            border: '1px solid',
                            borderColor: 'divider',
                            transition: 'all 0.2s',
                            '&:hover': {
                                boxShadow: '0 2px 12px rgba(0, 0, 0, 0.12)',
                                transform: 'translateY(-2px)'
                            }
                        }}
                    >
                        <CardContent sx={{ p: { xs: 1.5, sm: 2 }, '&:last-child': { pb: { xs: 1.5, sm: 2 } } }}>
                            {columns.map((column, idx) => {
                                const value = row[column.id];
                                return (
                                    <Box 
                                        key={column.id}
                                        sx={{ 
                                            mb: idx === columns.length - 1 ? { xs: 1, sm: 1.5 } : { xs: 0.75, sm: 1 },
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center'
                                        }}
                                    >
                                        <Typography 
                                            variant="caption" 
                                            sx={{ 
                                                color: 'text.secondary',
                                                fontWeight: 600,
                                                fontSize: { xs: '0.65rem', sm: '0.75rem' },
                                                textTransform: 'uppercase',
                                                letterSpacing: '0.3px',
                                                flex: '0 0 auto',
                                                mr: 1
                                            }}
                                        >
                                            {column.label}:
                                        </Typography>
                                        <Typography 
                                            variant="body2" 
                                            sx={{ 
                                                color: 'text.primary',
                                                fontWeight: 500,
                                                fontSize: { xs: '0.8rem', sm: '0.9rem' },
                                                textAlign: 'right',
                                                flex: 1
                                            }}
                                        >
                                            {column.format && typeof value === 'number'
                                                ? column.format(value)
                                                : value}
                                        </Typography>
                                    </Box>
                                );
                            })}
                            <Divider sx={{ my: { xs: 1, sm: 1.5 } }} />
                            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: { xs: 0.5, sm: 1 } }}>
                                <ButtonHaver row={row} />
                            </Box>
                        </CardContent>
                    </Card>
                ))}
        </Box>
    );

    // Desktop Table View
    const DesktopTableView = () => (
        <TableContainer sx={{ 
            maxHeight: 600,
            '&::-webkit-scrollbar': {
                width: '8px',
                height: '8px'
            },
            '&::-webkit-scrollbar-track': {
                background: '#f1f1f1',
                borderRadius: '4px'
            },
            '&::-webkit-scrollbar-thumb': {
                background: '#888',
                borderRadius: '4px',
                '&:hover': {
                    background: '#555'
                }
            }
        }}>
            <Table stickyHeader aria-label="modern data table">
                <TableHead>
                    <StyledTableRow>
                        {columns.map((column) => (
                            <StyledTableCell
                                key={column.id}
                                align={column.align}
                                style={{ minWidth: column.minWidth }}
                                sx={{
                                    bgcolor: 'background.paper',
                                    fontWeight: 700,
                                    fontSize: '0.875rem',
                                    color: 'text.primary',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.5px',
                                    borderBottom: '2px solid',
                                    borderColor: 'primary.main',
                                    py: 2
                                }}
                            >
                                {column.label}
                            </StyledTableCell>
                        ))}
                        <StyledTableCell 
                            align="center"
                            sx={{
                                bgcolor: 'background.paper',
                                fontWeight: 700,
                                fontSize: '0.875rem',
                                color: 'text.primary',
                                textTransform: 'uppercase',
                                letterSpacing: '0.5px',
                                borderBottom: '2px solid',
                                borderColor: 'primary.main',
                                py: 2
                            }}
                        >
                            Actions
                        </StyledTableCell>
                    </StyledTableRow>
                </TableHead>
                <TableBody>
                    {rows
                        .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                        .map((row) => {
                            return (
                                <StyledTableRow 
                                    hover 
                                    role="checkbox" 
                                    tabIndex={-1} 
                                    key={row.id}
                                    sx={{
                                        '&:hover': {
                                            bgcolor: 'action.hover',
                                            cursor: 'pointer'
                                        },
                                        transition: 'background-color 0.2s'
                                    }}
                                >
                                    {columns.map((column) => {
                                        const value = row[column.id];
                                        return (
                                            <StyledTableCell 
                                                key={column.id} 
                                                align={column.align}
                                                sx={{
                                                    fontSize: '0.875rem',
                                                    py: 2
                                                }}
                                            >
                                                {column.format && typeof value === 'number'
                                                    ? column.format(value)
                                                    : value}
                                            </StyledTableCell>
                                        );
                                    })}
                                    <StyledTableCell 
                                        align="center"
                                        sx={{ py: 2 }}
                                    >
                                        <ButtonHaver row={row} />
                                    </StyledTableCell>
                                </StyledTableRow>
                            );
                        })}
                </TableBody>
            </Table>
        </TableContainer>
    );

    return (
        <Box>
            {/* Data Display - Card View for All Devices */}
            <MobileCardView />

            {/* Modern Pagination */}
            <Box sx={{ 
                display: 'flex',
                flexDirection: { xs: 'column', sm: 'row' },
                alignItems: { xs: 'stretch', sm: 'center' },
                justifyContent: 'space-between',
                gap: { xs: 1, sm: 2 },
                p: { xs: 1.5, sm: 2 },
                borderTop: '1px solid',
                borderColor: 'divider',
                bgcolor: 'background.paper'
            }}>
                <Box sx={{ 
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    justifyContent: { xs: 'center', sm: 'flex-start' }
                }}>
                    <Typography 
                        variant="body2" 
                        sx={{ 
                            color: 'text.secondary',
                            fontSize: { xs: '0.7rem', sm: '0.875rem' }
                        }}
                    >
                        Total:
                    </Typography>
                    <Chip 
                        label={rows.length}
                        size="small"
                        sx={{
                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            color: 'white',
                            fontWeight: 600,
                            fontSize: { xs: '0.65rem', sm: '0.75rem' },
                            height: { xs: 20, sm: 24 }
                        }}
                    />
                </Box>
                
                <TablePagination
                    rowsPerPageOptions={[5, 10, 25, 100]}
                    component="div"
                    count={rows.length}
                    rowsPerPage={rowsPerPage}
                    page={page}
                    onPageChange={handleChangePage}
                    onRowsPerPageChange={handleChangeRowsPerPage}
                    sx={{
                        border: 'none',
                        '.MuiTablePagination-selectLabel, .MuiTablePagination-displayedRows': {
                            fontSize: { xs: '0.7rem', sm: '0.875rem' },
                            color: 'text.secondary',
                            m: 0
                        },
                        '.MuiTablePagination-select': {
                            fontSize: { xs: '0.7rem', sm: '0.875rem' }
                        },
                        '.MuiTablePagination-actions': {
                            ml: { xs: 0.5, sm: 2 },
                            '& .MuiIconButton-root': {
                                padding: { xs: '4px', sm: '8px' }
                            }
                        }
                    }}
                />
            </Box>
        </Box>
    );
};

export default TableTemplate;