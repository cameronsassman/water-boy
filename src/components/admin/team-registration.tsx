import { useState } from 'react';
import { Player, Team } from '@/types/team';
import { storageUtils } from '@/utils/storage';
import { validationUtils } from '@/utils/validation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Trash2, Plus, Users, Award } from 'lucide-react';

export default function TeamRegistration() {
  const [schoolName, setSchoolName] = useState('');
  const [coachName, setCoachName] = useState('');
  const [managerName, setManagerName] = useState('');
  const [players, setPlayers] = useState<Player[]>([
    { id: '1', name: '', capNumber: 1 }
  ]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const addPlayer = () => {
    if (players.length >= 13) return;
    
    const newPlayer: Player = {
      id: Date.now().toString(),
      name: '',
      capNumber: getNextAvailableCapNumber()
    };
    
    setPlayers([...players, newPlayer]);
  };

  const removePlayer = (playerId: string) => {
    if (players.length <= 1) return;
    setPlayers(players.filter(p => p.id !== playerId));
    
    // Clear any errors for removed player
    const newErrors = { ...errors };
    delete newErrors[`player_${playerId}_name`];
    delete newErrors[`player_${playerId}_cap`];
    setErrors(newErrors);
  };

  const updatePlayer = (playerId: string, field: 'name' | 'capNumber', value: string | number) => {
    setPlayers(players.map(p => 
      p.id === playerId 
        ? { ...p, [field]: value }
        : p
    ));
    
    // Clear related errors
    const newErrors = { ...errors };
    delete newErrors[`player_${playerId}_${field === 'capNumber' ? 'cap' : 'name'}`];
    setErrors(newErrors);
  };

  const getNextAvailableCapNumber = (): number => {
    const usedNumbers = players.map(p => p.capNumber);
    for (let i = 1; i <= 15; i++) {
      if (!usedNumbers.includes(i)) return i;
    }
    return 1;
  };

  const validateForm = async (): Promise<boolean> => {
    const newErrors: Record<string, string> = {};

    // Validate school name
    const schoolError = validationUtils.validateSchoolName(schoolName);
    if (schoolError) newErrors.schoolName = schoolError;

    // Check if school name is already taken
    if (!schoolError && await storageUtils.isSchoolNameTaken(schoolName)) {
      newErrors.schoolName = 'This school name is already registered';
    }

    // Validate coach name
    const coachError = validationUtils.validatePersonName(coachName, 'Coach');
    if (coachError) newErrors.coachName = coachError;

    // Validate manager name
    const managerError = validationUtils.validatePersonName(managerName, 'Manager');
    if (managerError) newErrors.managerName = managerError;

    // Validate team size
    const teamSizeError = validationUtils.validateTeamPlayers(players);
    if (teamSizeError) newErrors.teamSize = teamSizeError;

    // Validate each player
    players.forEach(player => {
      const nameError = validationUtils.validatePlayerName(player.name);
      if (nameError) newErrors[`player_${player.id}_name`] = nameError;

      const capError = validationUtils.validateCapNumber(player.capNumber, players, player.id);
      if (capError) newErrors[`player_${player.id}_cap`] = capError;
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    
    if (!validateForm()) return;

    setIsSubmitting(true);
    
    try {
      const newTeam: Team = {
        id: Date.now().toString(),
        schoolName: schoolName.trim(),
        coachName: coachName.trim(),
        managerName: managerName.trim(),
        players: players.map(p => ({
          ...p,
          name: p.name.trim()
        }))
      };

      console.log('Submitting team:', newTeam);

      storageUtils.addTeam(newTeam);
      
      // Reset form
      setSchoolName('');
      setCoachName('');
      setManagerName('');
      setPlayers([{ id: Date.now().toString(), name: '', capNumber: 1 }]);
      setErrors({});
      setSubmitSuccess(true);
      
      // Hide success message after 3 seconds
      setTimeout(() => setSubmitSuccess(false), 3000);
      
    } catch (error) {
      console.error('Error saving team:', error);
      setErrors({ submit: 'Failed to save team. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className=" p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Award className="text-blue-600" />
          Team Registration
        </h1>
        <p className="text-gray-600 mt-2">
          Register a new team for the U14 Water Polo Tournament
        </p>
      </div>

      {submitSuccess && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg text-green-800">
          ✅ Team registered successfully!
        </div>
      )}

      <div className="space-y-6">
        {/* Team Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Team Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">School Name</label>
              <Input
                value={schoolName}
                onChange={(e) => {
                  setSchoolName(e.target.value);
                  if (errors.schoolName) {
                    const { ...rest } = errors;
                    setErrors(rest);
                  }
                }}
                placeholder="Enter school name"
                className={errors.schoolName ? 'border-red-500' : ''}
              />
              {errors.schoolName && (
                <p className="text-red-500 text-sm mt-1">{errors.schoolName}</p>
              )}
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Coach Name</label>
                <Input
                  value={coachName}
                  onChange={(e) => {
                    setCoachName(e.target.value);
                    if (errors.coachName) {
                      const { ...rest } = errors;
                      setErrors(rest);
                    }
                  }}
                  placeholder="Enter coach name"
                  className={errors.coachName ? 'border-red-500' : ''}
                />
                {errors.coachName && (
                  <p className="text-red-500 text-sm mt-1">{errors.coachName}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Manager Name</label>
                <Input
                  value={managerName}
                  onChange={(e) => {
                    setManagerName(e.target.value);
                    if (errors.managerName) {
                      const { ...rest } = errors;
                      setErrors(rest);
                    }
                  }}
                  placeholder="Enter manager name"
                  className={errors.managerName ? 'border-red-500' : ''}
                />
                {errors.managerName && (
                  <p className="text-red-500 text-sm mt-1">{errors.managerName}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Players */}
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center justify-between'>
              Players ({players.length}/13)
              <Button
                type="button"
                onClick={addPlayer}
                disabled={players.length >= 13}
                size="sm"
                variant="outline"
              >
                <Plus className="w-4 h-4 mr-1" />
                Add Player
              </Button>
            </CardTitle>
            {errors.teamSize && (
              <p className="text-red-500 text-sm">{errors.teamSize}</p>
            )}
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
              {players.map((player, index) => (
                <div key={player.id} className="border rounded-lg p-4 bg-gray-50">
                  <div className="flex items-center justify-between mb-2">
                    <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                      {index + 1}
                    </div>
                    <Button
                      type="button"
                      onClick={() => removePlayer(player.id)}
                      disabled={players.length <= 1}
                      size="sm"
                      variant="ghost"
                      className="text-red-600 hover:text-red-700 h-8 w-8 p-0"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                  
                  <div className="space-y-2">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Player Name</label>
                      <Input
                        value={player.name}
                        onChange={(e) => updatePlayer(player.id, 'name', e.target.value)}
                        placeholder="Enter name"
                        className={`text-sm ${errors[`player_${player.id}_name`] ? 'border-red-500' : ''}`}
                      />
                      {errors[`player_${player.id}_name`] && (
                        <p className="text-red-500 text-xs mt-1">{errors[`player_${player.id}_name`]}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Cap #</label>
                      <Input
                        type="number"
                        min="1"
                        max="15"
                        value={player.capNumber}
                        onChange={(e) => updatePlayer(player.id, 'capNumber', parseInt(e.target.value) || 1)}
                        className={`text-sm ${errors[`player_${player.id}_cap`] ? 'border-red-500' : ''}`}
                      />
                      {errors[`player_${player.id}_cap`] && (
                        <p className="text-red-500 text-xs mt-1">{errors[`player_${player.id}_cap`]}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Submit */}
        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setSchoolName('');
              setCoachName('');
              setManagerName('');
              setPlayers([{ id: Date.now().toString(), name: '', capNumber: 1 }]);
              setErrors({});
            }}
          >
            Clear Form
          </Button>
          
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="min-w-32"
          >
            {isSubmitting ? 'Registering...' : 'Register Team'}
          </Button>
        </div>

        {errors.submit && (
          <p className="text-red-500 text-center">{errors.submit}</p>
        )}
      </div>
    </div>
  );
}