#!/usr/bin/env python3
from utils.supabaseClient import supabase

async def main():
    # Connexion à la base
    response = await supabase.from_('cards').update({
        'is_wip': True,
        'spells': [],
        'tags': [],
        'talent': None
    })

    data, error = response.data, response.error

    if error:
        print('Erreur lors de la mise à jour des cartes:', error)
    else:
        print('Mise à jour des cartes réussie:', data)

import asyncio
asyncio.run(main())
