-- Unificar spelling de roles: eliminar tildes para consistencia
UPDATE players SET role = 'Capitan' WHERE role = 'Capitán';
UPDATE players SET role = 'Subcapitan' WHERE role = 'Subcapitán';
